'use client';

import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Heading,
  HStack,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { FiClock, FiPlay, FiSquare } from 'react-icons/fi';

import { type Attendance, apiClient } from '@/lib/api/client';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { DashboardLayout } from '@/lib/layout/dashboard-layout';

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>(
    'success',
  );
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load today's attendance on component mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: false
  useEffect(() => {
    loadTodayAttendance();
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const loadTodayAttendance = async () => {
    try {
      const response = await apiClient.getTodayAttendance();
      if (response.data) {
        setTodayAttendance(response.data);
      }
    } catch (error) {
      console.error("Failed to load today's attendance:", error);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);

    try {
      const response = await apiClient.checkIn();
      if (response.error) {
        showMessage(response.error, 'error');
      } else {
        showMessage('Successfully checked in!', 'success');
        // Update the attendance directly from response
        if (response.data) {
          setTodayAttendance({
            id: response.data.id,
            userId: response.data.userId,
            date: format(new Date(response.data.date), 'yyyy-MM-dd'),
            checkInTime: response.data.checkInTime
              ? new Date(response.data.checkInTime).toISOString()
              : null,
            checkOutTime: null,
            status: 'in',
            createdAt: new Date(response.data.createdAt).toISOString(),
            updatedAt: new Date(response.data.updatedAt).toISOString(),
          });
        }
      }
    } catch (_error) {
      showMessage('Failed to check in', 'error');
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: acceptable for now
  const handleCheckOut = async () => {
    setLoading(true);

    try {
      const response = await apiClient.checkOut();
      if (response.error) {
        showMessage(response.error, 'error');
      } else {
        showMessage('Successfully checked out!', 'success');
        // Update the attendance directly from response
        if (response.data) {
          setTodayAttendance({
            id: response.data.id,
            userId: response.data.userId,
            date: format(new Date(response.data.date), 'yyyy-MM-dd'),
            checkInTime: response.data.checkInTime
              ? new Date(response.data.checkInTime).toISOString()
              : null,
            checkOutTime: response.data.checkOutTime
              ? new Date(response.data.checkOutTime).toISOString()
              : null,
            status: 'out',
            createdAt: new Date(response.data.createdAt).toISOString(),
            updatedAt: new Date(response.data.updatedAt).toISOString(),
          });
        }
      }
    } catch (_error) {
      showMessage('Failed to check out', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) {
      return '--:--';
    }
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrentTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusBadge = () => {
    if (!todayAttendance?.checkInTime) {
      return <Badge colorPalette="gray">Not Checked In</Badge>;
    }
    if (!todayAttendance?.checkOutTime) {
      return <Badge colorPalette="green">Checked In</Badge>;
    }
    return <Badge colorPalette="blue">Completed</Badge>;
  };

  const calculateWorkingTime = () => {
    if (!todayAttendance?.checkInTime) {
      return '--:--';
    }

    const checkIn = new Date(todayAttendance.checkInTime);
    const checkOut = todayAttendance.checkOutTime
      ? new Date(todayAttendance.checkOutTime)
      : currentTime;

    const diff = checkOut.getTime() - checkIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const canCheckIn = !todayAttendance?.checkInTime;
  const canCheckOut =
    todayAttendance?.checkInTime && !todayAttendance?.checkOutTime;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box maxWidth="800px" mx="auto">
          <Heading size="lg" mb={2}>
            Attendance Management
          </Heading>
          <Text color="gray.600" mb={6}>
            Manage your daily work from home attendance
          </Text>

          {message && (
            <Alert.Root status={messageType} mb={6}>
              <Alert.Indicator />
              <Alert.Title>{message}</Alert.Title>
            </Alert.Root>
          )}

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={6}>
            {/* Current Time Card */}
            <Card.Root>
              <Card.Body textAlign="center">
                <FiClock size={48} style={{ margin: '0 auto 16px' }} />
                <Heading size="lg" mb={2}>
                  {formatCurrentTime(currentTime)}
                </Heading>
                <Text color="gray.600">{formatDate(currentTime)}</Text>
              </Card.Body>
            </Card.Root>

            {/* Status Card */}
            <Card.Root>
              <Card.Body textAlign="center">
                <Box mb={4}>{getStatusBadge()}</Box>
                <Heading size="md" mb={2}>
                  Today's Status
                </Heading>
                <Text color="gray.600">
                  Working Time: {calculateWorkingTime()}
                </Text>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          {/* Action Buttons */}
          <Card.Root mb={6}>
            <Card.Header>
              <Heading size="md">Quick Actions</Heading>
              <Text color="gray.600">
                Check in when you start work, check out when you finish
              </Text>
            </Card.Header>
            <Card.Body>
              <HStack gap={4} justify="center">
                <Button
                  size="lg"
                  colorPalette="green"
                  onClick={handleCheckIn}
                  loading={loading}
                  disabled={!canCheckIn}
                  flex={1}
                  maxWidth="200px"
                >
                  <FiPlay />
                  Check In
                </Button>

                <Button
                  size="lg"
                  colorPalette="red"
                  onClick={handleCheckOut}
                  loading={loading}
                  disabled={!canCheckOut}
                  flex={1}
                  maxWidth="200px"
                >
                  <FiSquare />
                  Check Out
                </Button>
              </HStack>
            </Card.Body>
          </Card.Root>

          {/* Today's Details */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">Today's Attendance Details</Heading>
              <Text color="gray.600">Your attendance record for today</Text>
            </Card.Header>
            <Card.Body>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                <Box textAlign="center" p={4} bg="gray.50" rounded="md">
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Check In Time
                  </Text>
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    color={
                      todayAttendance?.checkInTime ? 'green.600' : 'gray.400'
                    }
                  >
                    {formatTime(todayAttendance?.checkInTime || null)}
                  </Text>
                </Box>

                <Box textAlign="center" p={4} bg="gray.50" rounded="md">
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Check Out Time
                  </Text>
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    color={
                      todayAttendance?.checkOutTime ? 'red.600' : 'gray.400'
                    }
                  >
                    {formatTime(todayAttendance?.checkOutTime || null)}
                  </Text>
                </Box>

                <Box textAlign="center" p={4} bg="gray.50" rounded="md">
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Working Hours
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                    {calculateWorkingTime()}
                  </Text>
                </Box>
              </SimpleGrid>

              {!todayAttendance?.checkInTime && (
                <Alert.Root status="info" mt={6}>
                  <Alert.Indicator />
                  <Alert.Title>
                    You haven't checked in yet today. Click "Check In" to start
                    your work session.
                  </Alert.Title>
                </Alert.Root>
              )}

              {todayAttendance?.checkInTime &&
                !todayAttendance?.checkOutTime && (
                  <Alert.Root status="warning" mt={6}>
                    <Alert.Indicator />
                    <Alert.Title>
                      You're currently checked in. Don't forget to check out
                      when you finish work.
                    </Alert.Title>
                  </Alert.Root>
                )}

              {todayAttendance?.checkInTime &&
                todayAttendance?.checkOutTime && (
                  <Alert.Root status="success" mt={6}>
                    <Alert.Indicator />
                    <Alert.Title>
                      Great! You've completed your work session for today.
                    </Alert.Title>
                  </Alert.Root>
                )}
            </Card.Body>
          </Card.Root>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
