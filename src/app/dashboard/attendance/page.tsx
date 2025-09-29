'use client';

import {
  Alert,
  Box,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  Spinner,
  Table,
  Text,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';

import { type Attendance, apiClient } from '@/lib/api/client';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { DashboardLayout } from '@/lib/layout/dashboard-layout';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Array<Attendance>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAttendances(
        page,
        10,
        dateFrom || undefined,
        dateTo || undefined,
      );
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setAttendances(response.data.data);
        setHasNextPage(response.data.hasNextPage);
      }
    } catch {
      setError('Failed to fetch attendances');
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  const handleFilter = () => {
    setPage(1);
    fetchAttendances();
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  if (loading && attendances.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            h="200px"
          >
            <Spinner size="xl" />
          </Box>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error && attendances.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Title>Error!</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box>
          <Heading size="lg" mb={6}>
            Attendance
          </Heading>

          <Box mb={6}>
            <HStack gap={4} mb={4}>
              <Field.Root>
                <Field.Label>Date From</Field.Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Date To</Field.Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Field.Root>
              <Button onClick={handleFilter} mt={8}>
                Filter
              </Button>
            </HStack>
          </Box>

          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>User ID</Table.ColumnHeader>
                <Table.ColumnHeader>Date</Table.ColumnHeader>
                <Table.ColumnHeader>Check In Time</Table.ColumnHeader>
                <Table.ColumnHeader>Check Out Time</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Created At</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {attendances.map((attendance) => (
                <Table.Row key={attendance.id}>
                  <Table.Cell>{attendance.id}</Table.Cell>
                  <Table.Cell>{attendance.userId}</Table.Cell>
                  <Table.Cell>
                    {new Date(attendance.date).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    {attendance.checkInTime
                      ? new Date(attendance.checkInTime).toLocaleString()
                      : '-'}
                  </Table.Cell>
                  <Table.Cell>
                    {attendance.checkOutTime
                      ? new Date(attendance.checkOutTime).toLocaleString()
                      : '-'}
                  </Table.Cell>
                  <Table.Cell>{attendance.status || '-'}</Table.Cell>
                  <Table.Cell>
                    {new Date(attendance.createdAt).toLocaleDateString()}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          {attendances.length === 0 && !loading && (
            <Text textAlign="center" mt={8} color="gray.500">
              No attendances found
            </Text>
          )}

          <HStack justify="center" mt={6} gap={4}>
            <Button
              onClick={handlePrevPage}
              disabled={page === 1}
              variant="outline"
            >
              Previous
            </Button>
            <Text>Page {page}</Text>
            <Button
              onClick={handleNextPage}
              disabled={!hasNextPage}
              variant="outline"
            >
              Next
            </Button>
          </HStack>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
