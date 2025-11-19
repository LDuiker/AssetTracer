import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Reservation } from '@/types/reservation';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 25,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#333',
    marginBottom: 3,
  },
  reservationInfo: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 100,
    color: '#333',
  },
  infoValue: {
    flex: 1,
    color: '#666',
  },
  categorySection: {
    marginBottom: 15,
    border: '1 solid #ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryHeader: {
    padding: 10,
    fontWeight: 'bold',
    fontSize: 13,
    color: '#fff',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderBottom: '2 solid #ddd',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1 solid #eee',
    minHeight: 30,
  },
  tableCell: {
    fontSize: 10,
    color: '#333',
    paddingVertical: 2,
  },
  colDescription: {
    flex: 3,
  },
  colAvailable: {
    width: 100,
    textAlign: 'right',
  },
  colType: {
    width: 120,
  },
  subcategory: {
    paddingLeft: 15,
    backgroundColor: '#fafafa',
  },
  subcategoryHeader: {
    padding: 6,
    paddingLeft: 15,
    fontWeight: 'bold',
    fontSize: 10,
    color: '#555',
    backgroundColor: '#f0f0f0',
  },
  emptyState: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
    fontSize: 11,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: '1 solid #ddd',
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
});

// Category color mapping (matching the image style)
const categoryColors: Record<string, string> = {
  Sound: '#FFD700', // Yellow
  Audio: '#87CEEB', // Light blue
  Lighting: '#90EE90', // Light green
  Cables: '#FFA500', // Orange
  Video: '#DDA0DD', // Plum
  Power: '#FF6347', // Tomato
  Staging: '#20B2AA', // Light sea green
  Other: '#A9A9A9', // Dark gray
};

// Default color for unknown categories
const defaultCategoryColor = '#E0E0E0';

interface ReservationPackingListTemplateProps {
  reservation: Reservation;
  organizationName: string;
}

export function ReservationPackingListTemplate({
  reservation,
  organizationName,
}: ReservationPackingListTemplateProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string, timeString: string | null) => {
    const date = formatDate(dateString);
    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${date} at ${displayHour}:${minutes} ${ampm}`;
    }
    return date;
  };

  // Group assets by category
  const assetsByCategory = (reservation.assets || []).reduce(
    (acc, reservationAsset) => {
      const category = reservationAsset.asset?.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(reservationAsset);
      return acc;
    },
    {} as Record<string, typeof reservation.assets>
  );

  // Sort categories (put "Other" last)
  const sortedCategories = Object.keys(assetsByCategory).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  // Get category color
  const getCategoryColor = (category: string) => {
    // Try exact match first
    if (categoryColors[category]) {
      return categoryColors[category];
    }
    // Try partial match (e.g., "Sound Equipment" matches "Sound")
    for (const [key, color] of Object.entries(categoryColors)) {
      if (category.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    return defaultCategoryColor;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Equipment Packing List</Text>
          <Text style={styles.subtitle}>{organizationName}</Text>
          <Text style={styles.subtitle}>
            Generated: {format(new Date(), 'MMMM dd, yyyy')}
          </Text>
        </View>

        {/* Reservation Information */}
        <View style={styles.reservationInfo}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
            {reservation.title}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Project:</Text>
            <Text style={styles.infoValue}>
              {reservation.project_name || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date:</Text>
            <Text style={styles.infoValue}>
              {formatDateTime(reservation.start_date, reservation.start_time)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date:</Text>
            <Text style={styles.infoValue}>
              {formatDateTime(reservation.end_date, reservation.end_time)}
            </Text>
          </View>
          {reservation.location && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{reservation.location}</Text>
            </View>
          )}
          {reservation.reserved_by_user && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reserved By:</Text>
              <Text style={styles.infoValue}>
                {reservation.reserved_by_user.name}
              </Text>
            </View>
          )}
        </View>

        {/* Equipment List by Category */}
        {sortedCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text>No equipment items in this reservation.</Text>
          </View>
        ) : (
          sortedCategories.map((category) => {
            const assets = assetsByCategory[category] || [];
            const categoryColor = getCategoryColor(category);

            return (
              <View key={category} style={styles.categorySection}>
                {/* Category Header */}
                <View
                  style={[
                    styles.categoryHeader,
                    { backgroundColor: categoryColor },
                  ]}
                >
                  <Text>{category}</Text>
                </View>

                {/* Table */}
                <View style={styles.table}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.colDescription]}>
                      Description
                    </Text>
                    <Text style={[styles.tableHeaderText, styles.colAvailable]}>
                      Available
                    </Text>
                    <Text style={[styles.tableHeaderText, styles.colType]}>
                      Type
                    </Text>
                  </View>

                  {/* Table Rows */}
                  {assets.map((reservationAsset, index) => {
                    const asset = reservationAsset.asset;
                    const assetName = asset?.name || 'Unknown Asset';
                    const quantity = reservationAsset.quantity;
                    const status = asset?.status || 'Unknown';
                    const location = asset?.location;

                    return (
                      <View
                        key={reservationAsset.id || index}
                        style={[
                          styles.tableRow,
                          index % 2 === 0 && { backgroundColor: '#fafafa' },
                        ]}
                      >
                        <Text style={[styles.tableCell, styles.colDescription]}>
                          {assetName}
                          {location && (
                            <Text style={{ color: '#666', fontSize: 9 }}>
                              {' '}({location})
                            </Text>
                          )}
                        </Text>
                        <Text style={[styles.tableCell, styles.colAvailable]}>
                          {quantity} {quantity === 1 ? 'Pc' : 'Pcs'}
                        </Text>
                        <Text style={[styles.tableCell, styles.colType]}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Total Items: {reservation.assets?.reduce((sum, a) => sum + a.quantity, 0) || 0} |{' '}
            Total Assets: {reservation.assets?.length || 0}
          </Text>
          {reservation.notes && (
            <Text style={{ marginTop: 5 }}>
              Notes: {reservation.notes}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
}

