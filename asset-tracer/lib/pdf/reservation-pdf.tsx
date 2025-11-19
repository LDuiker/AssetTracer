import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Reservation } from '@/types/reservation';
import { format } from 'date-fns';

// Register fonts (optional - using default Helvetica for now)
// Font.register({
//   family: 'Roboto',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.woff2' },
//     { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmEU9fBBc4.woff2', fontWeight: 'bold' },
//   ],
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  reservationCard: {
    border: '1 solid #ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reservationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    fontSize: 9,
    padding: '4 8',
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    width: 100,
    color: '#333',
  },
  value: {
    flex: 1,
    color: '#666',
  },
  assetsList: {
    marginTop: 6,
    paddingLeft: 10,
  },
  assetItem: {
    fontSize: 9,
    color: '#555',
    marginBottom: 2,
  },
  divider: {
    borderTop: '1 solid #eee',
    marginTop: 10,
    paddingTop: 10,
  },
});

interface ReservationPDFTemplateProps {
  reservations: Reservation[];
  organizationName: string;
}

export function ReservationPDFTemplate({
  reservations,
  organizationName,
}: ReservationPDFTemplateProps) {
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
      return `${date} at ${timeString}`;
    }
    return date;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#fbbf24',
      confirmed: '#3b82f6',
      active: '#10b981',
      completed: '#6b7280',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Reservations Report</Text>
          <Text style={styles.subtitle}>{organizationName}</Text>
          <Text style={styles.subtitle}>
            Generated: {format(new Date(), 'MMMM dd, yyyy')}
          </Text>
          <Text style={styles.subtitle}>
            Total Reservations: {reservations.length}
          </Text>
        </View>

        <View style={styles.section}>
          {reservations.length === 0 ? (
            <Text>No reservations found.</Text>
          ) : (
            reservations.map((reservation, index) => (
              <View
                key={reservation.id}
                style={[
                  styles.reservationCard,
                  index < reservations.length - 1 && styles.divider,
                ]}
              >
                <View style={styles.reservationHeader}>
                  <Text style={styles.reservationTitle}>
                    {reservation.title}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(reservation.status) + '40' },
                    ]}
                  >
                    <Text style={{ color: getStatusColor(reservation.status) }}>
                      {reservation.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Project:</Text>
                  <Text style={styles.value}>
                    {reservation.project_name || 'N/A'}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Period:</Text>
                  <Text style={styles.value}>
                    {formatDateTime(reservation.start_date, reservation.start_time)} -{' '}
                    {formatDateTime(reservation.end_date, reservation.end_time)}
                  </Text>
                </View>

                {reservation.location && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Location:</Text>
                    <Text style={styles.value}>{reservation.location}</Text>
                  </View>
                )}

                {reservation.reserved_by_user && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Reserved By:</Text>
                    <Text style={styles.value}>
                      {reservation.reserved_by_user.name} (
                      {reservation.reserved_by_user.email})
                    </Text>
                  </View>
                )}

                {reservation.priority && reservation.priority !== 'normal' && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Priority:</Text>
                    <Text style={styles.value}>{reservation.priority}</Text>
                  </View>
                )}

                {reservation.description && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Description:</Text>
                    <Text style={styles.value}>{reservation.description}</Text>
                  </View>
                )}

                {reservation.assets && reservation.assets.length > 0 && (
                  <View style={styles.assetsList}>
                    <Text style={[styles.label, { marginBottom: 4 }]}>
                      Assets:
                    </Text>
                    {reservation.assets.map((asset, assetIndex) => (
                      <Text key={assetIndex} style={styles.assetItem}>
                        • {asset.asset?.name || 'Unknown Asset'}
                        {asset.quantity > 1 && ` (×${asset.quantity})`}
                        {asset.asset?.category && ` - ${asset.asset.category}`}
                      </Text>
                    ))}
                  </View>
                )}

                {reservation.notes && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Notes:</Text>
                    <Text style={styles.value}>{reservation.notes}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}

