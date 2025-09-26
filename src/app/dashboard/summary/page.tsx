'use client';

import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  EmptyState,
  Field,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Table,
  Text,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiCalendar, FiDownload, FiSearch } from 'react-icons/fi';
import * as yup from 'yup';

import { type AttendanceSummary, apiClient } from '@/lib/api/client';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { DashboardLayout } from '@/lib/layout/dashboard-layout';

// Date filter validation schema
const dateRangeSchema = yup.object({
  dateFrom: yup
    .string()
    .required('From date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date'),
  dateTo: yup
    .string()
    .required('To date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date')
    .test('date-range', 'To date must be after from date', function (value) {
      const { dateFrom } = this.parent;
      if (!(dateFrom && value)) {
        return true;
      }
      return new Date(value) >= new Date(dateFrom);
    }),
});

type DateRangeFormData = yup.InferType<typeof dateRangeSchema>;

export default function SummaryPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>(
    'success',
  );
  const [attendanceData, setAttendanceData] = useState<
    Array<AttendanceSummary>
  >([]);

  // Date filter form
  const dateForm = useForm<DateRangeFormData>({
    resolver: yupResolver(dateRangeSchema),
    mode: 'onChange',
  });

  const { dateFrom, dateTo } = dateForm.watch();

  useEffect(() => {
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date();

    const defaultDateFrom = format(firstDay, 'yyyy-MM-dd');
    const defaultDateTo = format(today, 'yyyy-MM-dd');

    dateForm.setValue('dateFrom', defaultDateFrom);
    dateForm.setValue('dateTo', defaultDateTo);
  }, [dateForm]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: false
  useEffect(() => {
    if (dateFrom && dateTo) {
      loadAttendanceSummary();
    }
  }, [dateFrom, dateTo]);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const loadAttendanceSummary = async () => {
    setLoading(true);

    try {
      const response = await apiClient.getAttendanceSummary(dateFrom, dateTo);
      if (response.error) {
        showMessage(response.error, 'error');
      } else {
        setAttendanceData(response.data || []);
      }
    } catch (_error) {
      showMessage('Failed to load attendance summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadAttendanceSummary();
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) {
      return '--:--';
    }
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateWorkingHours = (
    checkInTime: string | null,
    checkOutTime: string | null,
  ) => {
    if (!(checkInTime && checkOutTime)) {
      return '--:--';
    }

    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const diff = checkOut.getTime() - checkIn.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (
    checkInTime: string | null,
    checkOutTime: string | null,
  ) => {
    if (!checkInTime) {
      return <Badge colorPalette="gray">Absent</Badge>;
    }
    if (!checkOutTime) {
      return <Badge colorPalette="orange">Incomplete</Badge>;
    }
    return <Badge colorPalette="green">Complete</Badge>;
  };

  const calculateStats = () => {
    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter(
      (item) => item.checkInTime,
    ).length;
    const completeDays = attendanceData.filter(
      (item) => item.checkInTime && item.checkOutTime,
    ).length;

    let totalHours = 0;
    attendanceData.forEach((item) => {
      if (item.checkInTime && item.checkOutTime) {
        const checkIn = new Date(item.checkInTime);
        const checkOut = new Date(item.checkOutTime);
        const diff = checkOut.getTime() - checkIn.getTime();
        totalHours += diff / (1000 * 60 * 60);
      }
    });

    const averageHours = completeDays > 0 ? totalHours / completeDays : 0;

    return {
      totalDays,
      presentDays,
      completeDays,
      totalHours: Math.round(totalHours * 10) / 10,
      averageHours: Math.round(averageHours * 10) / 10,
      attendanceRate:
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
    };
  };

  const stats = calculateStats();

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Check In', 'Check Out', 'Working Hours', 'Status'],
      ...attendanceData.map((item) => [
        formatDate(item.date),
        formatTime(item.checkInTime),
        formatTime(item.checkOutTime),
        calculateWorkingHours(item.checkInTime, item.checkOutTime),
        item.checkInTime && item.checkOutTime
          ? 'Complete'
          : item.checkInTime
            ? 'Incomplete'
            : 'Absent',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-summary-${dateFrom}-to-${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box maxWidth="1200px" mx="auto">
          <Heading size="lg" mb={2}>
            Attendance Summary
          </Heading>
          <Text color="gray.600" mb={6}>
            View your attendance history and generate reports
          </Text>

          {message && (
            <Alert.Root status={messageType} mb={6}>
              <Alert.Indicator />
              <Alert.Title>{message}</Alert.Title>
            </Alert.Root>
          )}

          {/* Filter Card */}
          <Card.Root mb={6}>
            <Card.Header>
              <Heading size="md">Date Range Filter</Heading>
              <Text color="gray.600">
                Select date range to view attendance summary
              </Text>
            </Card.Header>
            <Card.Body>
              <form onSubmit={dateForm.handleSubmit(handleSearch)}>
                <HStack gap={4} align="end">
                  <Field.Root invalid={!!dateForm.formState.errors.dateFrom}>
                    <Field.Label>From Date</Field.Label>
                    <Input type="date" {...dateForm.register('dateFrom')} />
                    {dateForm.formState.errors.dateFrom && (
                      <Field.ErrorText>
                        {dateForm.formState.errors.dateFrom.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>

                  <Field.Root invalid={!!dateForm.formState.errors.dateTo}>
                    <Field.Label>To Date</Field.Label>
                    <Input type="date" {...dateForm.register('dateTo')} />
                    {dateForm.formState.errors.dateTo && (
                      <Field.ErrorText>
                        {dateForm.formState.errors.dateTo.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>

                  <Button
                    type="submit"
                    colorPalette="blue"
                    loading={loading || dateForm.formState.isSubmitting}
                  >
                    <FiSearch />
                    Search
                  </Button>

                  {attendanceData.length > 0 && (
                    <Button variant="outline" onClick={exportToCSV}>
                      <FiDownload />
                      Export CSV
                    </Button>
                  )}
                </HStack>
              </form>
            </Card.Body>
          </Card.Root>

          {/* Statistics Cards */}
          {attendanceData.length > 0 && (
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
              <Card.Root>
                <Card.Body textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                    {stats.attendanceRate}%
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Attendance Rate
                  </Text>
                </Card.Body>
              </Card.Root>

              <Card.Root>
                <Card.Body textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">
                    {stats.presentDays}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Present Days
                  </Text>
                </Card.Body>
              </Card.Root>

              <Card.Root>
                <Card.Body textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                    {stats.totalHours}h
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Total Hours
                  </Text>
                </Card.Body>
              </Card.Root>

              <Card.Root>
                <Card.Body textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                    {stats.averageHours}h
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Average Hours
                  </Text>
                </Card.Body>
              </Card.Root>
            </SimpleGrid>
          )}

          {/* Attendance Table */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">Attendance Records</Heading>
              <Text color="gray.600">
                Detailed view of your attendance for the selected period
              </Text>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <Text textAlign="center" py={8}>
                  Loading attendance data...
                </Text>
              ) : attendanceData.length > 0 ? (
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Date</Table.ColumnHeader>
                      <Table.ColumnHeader>Check In</Table.ColumnHeader>
                      <Table.ColumnHeader>Check Out</Table.ColumnHeader>
                      <Table.ColumnHeader>Working Hours</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {attendanceData.map((item, index) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: index is acceptable here as data is static
                      <Table.Row key={index}>
                        <Table.Cell fontWeight="medium">
                          {formatDate(item.date)}
                        </Table.Cell>
                        <Table.Cell
                          color={item.checkInTime ? 'green.600' : 'gray.400'}
                        >
                          {formatTime(item.checkInTime)}
                        </Table.Cell>
                        <Table.Cell
                          color={item.checkOutTime ? 'red.600' : 'gray.400'}
                        >
                          {formatTime(item.checkOutTime)}
                        </Table.Cell>
                        <Table.Cell fontWeight="medium">
                          {calculateWorkingHours(
                            item.checkInTime,
                            item.checkOutTime,
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          {getStatusBadge(item.checkInTime, item.checkOutTime)}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              ) : (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <FiCalendar size={48} />
                    </EmptyState.Indicator>
                    <EmptyState.Title>No Attendance Records</EmptyState.Title>
                    <EmptyState.Description>
                      No attendance records found for the selected date range.
                      Try adjusting your date filters or check your attendance
                      in the Attendance tab.
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Card.Body>
          </Card.Root>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
