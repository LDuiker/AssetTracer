import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionLimits, type SubscriptionTier } from '@/lib/subscription/limits';
import type { CreateAssetInput } from '@/types';

const ASSET_STATUSES = ['active', 'maintenance', 'retired', 'sold'] as const;
const ASSET_TYPES = ['individual', 'group'] as const;

type AssetStatus = (typeof ASSET_STATUSES)[number];
type AssetType = (typeof ASSET_TYPES)[number];

type ParsedAssetRow = Omit<CreateAssetInput, 'organization_id' | 'created_at' | 'updated_at'>;

interface ImportError {
  row: number;
  issues: string[];
}

const COLUMN_ALIASES: Record<string, keyof ParsedAssetRow | 'parent_group_id'> = {
  name: 'name',
  asset_name: 'name',
  description: 'description',
  details: 'description',
  category: 'category',
  status: 'status',
  state: 'status',
  location: 'location',
  serial_number: 'serial_number',
  serial: 'serial_number',
  purchase_date: 'purchase_date',
  acquired_date: 'purchase_date',
  acquisition_date: 'purchase_date',
  purchase_cost: 'purchase_cost',
  purchase_price: 'purchase_cost',
  purchase_value: 'purchase_cost',
  current_value: 'current_value',
  value: 'current_value',
  asset_type: 'asset_type',
  type: 'asset_type',
  quantity: 'quantity',
  total_items: 'quantity',
  parent_group_id: 'parent_group_id',
  group_id: 'parent_group_id',
};

const importAssetSchema = z.object({
  name: z.string().min(2, 'Name is required and must be at least 2 characters'),
  description: z.string().nullable(),
  category: z.string().nullable(),
  purchase_date: z.string().nullable(),
  purchase_cost: z.number().min(0, 'Purchase cost must be 0 or greater'),
  current_value: z.number().min(0, 'Current value must be 0 or greater'),
  status: z.enum(ASSET_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${ASSET_STATUSES.join(', ')}` }),
  }),
  location: z.string().nullable(),
  serial_number: z.string().nullable(),
  asset_type: z.enum(ASSET_TYPES, {
    errorMap: () => ({ message: `Asset type must be one of: ${ASSET_TYPES.join(', ')}` }),
  }),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  parent_group_id: z.string().uuid().nullable(),
  image_url: z.string().url().nullable(),
});

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .trim();
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  return String(value);
}

function parseNumberField(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.replace(/,/g, '').trim();
    if (trimmed === '') return null;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function parseIntegerField(value: unknown): number | null {
  const parsed = parseNumberField(value);
  if (parsed === null) return null;
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

function normalizeDate(value: unknown): { date: string | null; error?: string } {
  if (value === null || value === undefined) return { date: null };
  if (typeof value !== 'string') return { date: null };
  const trimmed = value.trim();
  if (!trimmed) return { date: null };

  // Accept YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/;
  if (isoMatch.test(trimmed)) {
    return { date: trimmed };
  }

  const replaced = trimmed.replace(/\./g, '/').replace(/-/g, '/');
  const parts = replaced.split('/');
  let candidate: Date | null = null;

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY/MM/DD
      candidate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else if (parts[2].length === 4) {
      // Assume DD/MM/YYYY or MM/DD/YYYY; try both
      const dayFirst = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      const monthFirst = new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));

      if (!Number.isNaN(dayFirst.getTime())) {
        candidate = dayFirst;
      } else if (!Number.isNaN(monthFirst.getTime())) {
        candidate = monthFirst;
      }
    }
  }

  if (!candidate || Number.isNaN(candidate.getTime())) {
    const fallback = new Date(trimmed);
    if (!Number.isNaN(fallback.getTime())) {
      candidate = fallback;
    }
  }

  if (!candidate || Number.isNaN(candidate.getTime())) {
    return { date: null, error: `Invalid date value: ${trimmed}` };
  }

  return { date: candidate.toISOString().slice(0, 10) };
}

function normalizeAssetType(value: unknown): AssetType {
  if (typeof value !== 'string') return 'individual';
  const normalized = value.trim().toLowerCase();
  return (ASSET_TYPES as readonly string[]).includes(normalized)
    ? (normalized as AssetType)
    : 'individual';
}

function normalizeStatus(value: unknown): AssetStatus {
  if (typeof value !== 'string') return 'active';
  const normalized = value.trim().toLowerCase();
  return (ASSET_STATUSES as readonly string[]).includes(normalized)
    ? (normalized as AssetStatus)
    : 'active';
}

function buildParsedRow(
  record: Record<string, unknown>,
  rowNumber: number,
  errors: ImportError[],
): ParsedAssetRow | null {
  const normalizedRecord: Partial<Record<keyof ParsedAssetRow | 'parent_group_id', unknown>> = {};

  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = normalizeKey(key);
    const targetKey = COLUMN_ALIASES[normalizedKey];
    if (targetKey) {
      normalizedRecord[targetKey] = value;
    }
  }

  const issues: string[] = [];

  const name = toStringOrNull(normalizedRecord.name);
  if (!name) {
    issues.push('Missing required "name" value');
  }

  const description = toStringOrNull(normalizedRecord.description);
  const category = toStringOrNull(normalizedRecord.category);
  const location = toStringOrNull(normalizedRecord.location);
  const serialNumber = toStringOrNull(normalizedRecord.serial_number);

  const { date: purchaseDate, error: dateError } = normalizeDate(normalizedRecord.purchase_date ?? null);
  if (dateError) {
    issues.push(dateError);
  }

  const parsedPurchaseCost = parseNumberField(normalizedRecord.purchase_cost);
  const parsedCurrentValue = parseNumberField(normalizedRecord.current_value);

  if (parsedPurchaseCost === null) {
    issues.push('Purchase cost is missing or invalid');
  }

  const assetType = normalizeAssetType(normalizedRecord.asset_type);
  const quantityValue = parseIntegerField(normalizedRecord.quantity);

  if (assetType === 'group' && (quantityValue === null || quantityValue < 1)) {
    issues.push('Quantity is required for group assets and must be a positive integer');
  }

  if (issues.length > 0) {
    errors.push({ row: rowNumber, issues });
    return null;
  }

  const parsedRow = {
    name,
    description,
    category,
    purchase_date: purchaseDate,
    purchase_cost: parsedPurchaseCost ?? 0,
    current_value: parsedCurrentValue ?? parsedPurchaseCost ?? 0,
    status: normalizeStatus(normalizedRecord.status),
    location,
    serial_number: serialNumber,
    asset_type: assetType,
    quantity: assetType === 'group' ? quantityValue ?? 1 : 1,
    parent_group_id:
      assetType === 'group'
        ? toStringOrNull(normalizedRecord.parent_group_id)
        : null,
    image_url: null,
  } satisfies ParsedAssetRow;

  const validation = importAssetSchema.safeParse(parsedRow);
  if (!validation.success) {
    const validationIssues = validation.error.issues.map((issue) => issue.message);
    errors.push({ row: rowNumber, issues: validationIssues });
    return null;
  }

  return validation.data;
}

async function getOrganizationContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionUser: { id: string; user_metadata?: Record<string, unknown> },
) {
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', sessionUser.id)
    .single();

  const organizationId =
    userProfile?.organization_id ??
    (sessionUser.user_metadata?.organization_id as string | undefined) ??
    null;

  if (profileError && !organizationId) {
    console.error('Error fetching user profile in asset import:', profileError);
  }

  if (!organizationId) {
    return { organizationId: null, subscriptionTier: null as SubscriptionTier | null };
  }

  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select('subscription_tier')
    .eq('id', organizationId)
    .single();

  if (organizationError) {
    console.error('Error fetching organization in asset import:', organizationError);
    return { organizationId, subscriptionTier: 'free' as SubscriptionTier };
  }

  return {
    organizationId,
    subscriptionTier: (organization?.subscription_tier as SubscriptionTier) ?? 'free',
  };
}

async function ensureAssetLimit(
  supabase: Awaited<ReturnType<typeof createClient>>, 
  organizationId: string, 
  intendedInserts: number, 
  tier: SubscriptionTier,
) {
  const limits = getSubscriptionLimits(tier);
  if (!Number.isFinite(limits.maxAssets)) {
    return;
  }

  const { count, error } = await supabase
    .from('assets')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error counting assets before import:', error);
    throw new Error('Failed to verify asset limits before import');
  }

  const currentCount = count ?? 0;
  if (currentCount + intendedInserts > limits.maxAssets) {
    throw new Error(
      `Import would exceed your plan limit (${limits.maxAssets} assets). ` +
        `Current assets: ${currentCount}, attempted import: ${intendedInserts}.`,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No import file provided. Please select a CSV file to upload.' },
        { status: 400 },
      );
    }

    const text = await file.text();

    let records: Record<string, unknown>[];
    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseError) {
      console.error('Error parsing CSV import file:', parseError);
      return NextResponse.json(
        {
          error: 'Unable to parse CSV file. Please ensure it is a valid comma-separated file with a header row.',
        },
        { status: 400 },
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'The CSV file is empty. Add at least one asset row to import.' },
        { status: 400 },
      );
    }

    const errors: ImportError[] = [];
    const validRows: ParsedAssetRow[] = [];

    records.forEach((record, index) => {
      const parsedRow = buildParsedRow(record, index + 2, errors); // +2 to account for header (row 1)
      if (parsedRow) {
        validRows.push(parsedRow);
      }
    });

    if (validRows.length === 0) {
      return NextResponse.json(
        {
          error: 'No rows were imported because every row has validation issues.',
          details: errors,
        },
        { status: 400 },
      );
    }

    const { organizationId, subscriptionTier } = await getOrganizationContext(supabase, session.user);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 },
      );
    }

    const tier = subscriptionTier ?? 'free';

    try {
      await ensureAssetLimit(supabase, organizationId, validRows.length, tier);
    } catch (limitError) {
      return NextResponse.json(
        { error: limitError instanceof Error ? limitError.message : String(limitError) },
        { status: 400 },
      );
    }

    const preparedRows = validRows.map((row) => ({
      ...row,
      organization_id: organizationId,
      created_by: session.user.id,
      quantity: row.asset_type === 'group' ? row.quantity : 1,
      parent_group_id: row.asset_type === 'group' ? row.parent_group_id : null,
    }));

    const { data: insertedAssets, error: insertError } = await supabase
      .from('assets')
      .insert(preparedRows)
      .select('*');

    if (insertError) {
      console.error('Error inserting imported assets:', insertError);
      return NextResponse.json(
        { error: `Failed to import assets: ${insertError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        imported: insertedAssets?.length ?? 0,
        failed: errors.length,
        errors,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/assets/import:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 },
    );
  }
}


