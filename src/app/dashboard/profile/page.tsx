'use client';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Field,
  Heading,
  HStack,
  Input,
  Separator,
  Stack,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiCamera, FiSave } from 'react-icons/fi';
import * as yup from 'yup';

import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { DashboardLayout } from '@/lib/layout/dashboard-layout';
import { useNotifications } from '@/lib/notifications/notification-context';

// Validation schemas
const phoneSchema = yup.object({
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^[\d\s\-+()]+$/, 'Please enter a valid phone number'),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
});

type PhoneFormData = yup.InferType<typeof phoneSchema>;
type PasswordFormData = yup.InferType<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotifications();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>(
    'success',
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Phone form
  const phoneForm = useForm<PhoneFormData>({
    resolver: yupResolver(phoneSchema),
    mode: 'onBlur',
    defaultValues: {
      phone: user?.phone || '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (user?.phone) {
      phoneForm.setValue('phone', user.phone);
    }
  }, [user, phoneForm]);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedFile]);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handlePhoneUpdate = async (data: PhoneFormData) => {
    try {
      const response = await apiClient.updateProfile({ phone: data.phone });
      if (response.error) {
        showMessage(response.error, 'error');
      } else {
        showMessage('Phone number updated successfully!', 'success');
        showNotification(
          'Profile updated successfully! Admin has been notified.',
          'info',
        );
        await refreshUser();
      }
    } catch (_error) {
      showMessage('Failed to update phone number', 'error');
    }
  };

  const handlePasswordUpdate = async (data: PasswordFormData) => {
    try {
      const response = await apiClient.updateProfile({
        password: data.newPassword,
      });
      if (response.error) {
        showMessage(response.error, 'error');
      } else {
        showMessage('Password updated successfully!', 'success');
        passwordForm.reset();
      }
    } catch (_error) {
      showMessage('Failed to update password', 'error');
    }
  };

  const [photoUploading, setPhotoUploading] = useState(false);

  const handlePhotoUpload = async () => {
    if (!selectedFile) {
      showMessage('Please select a photo first', 'error');
      return;
    }

    setPhotoUploading(true);

    try {
      const response = await apiClient.updateProfile({ photo: selectedFile });
      if (response.error) {
        showMessage(response.error, 'error');
      } else {
        showMessage('Photo updated successfully!', 'success');
        showNotification(
          'Profile photo updated successfully! Admin has been notified.',
          'info',
        );
        setSelectedFile(null);
        setPreviewUrl(null);
        await refreshUser();
      }
    } catch (_error) {
      showMessage('Failed to update photo', 'error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showMessage('File size must be less than 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showMessage('Please select an image file', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box maxWidth="800px" mx="auto">
          <Heading size="lg" mb={6}>
            Profile Management
          </Heading>

          {message && (
            <Alert.Root status={messageType} mb={6}>
              <Alert.Indicator />
              <Alert.Title>{message}</Alert.Title>
            </Alert.Root>
          )}

          <Tabs.Root defaultValue="profile" variant="enclosed">
            <Tabs.List>
              <Tabs.Trigger value="profile">Profile Info</Tabs.Trigger>
              <Tabs.Trigger value="photo">Photo</Tabs.Trigger>
              <Tabs.Trigger value="password">Password</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="profile">
              <Card.Root>
                <Card.Header>
                  <Heading size="md">Basic Information</Heading>
                  <Text color="gray.600">
                    View your basic profile information and update your phone
                    number
                  </Text>
                </Card.Header>
                <Card.Body>
                  <Stack gap={6}>
                    <HStack gap={6}>
                      <Field.Root>
                        <Field.Label>First Name</Field.Label>
                        <Input value={user?.firstName || ''} disabled />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>Last Name</Field.Label>
                        <Input value={user?.lastName || ''} disabled />
                      </Field.Root>
                    </HStack>

                    <Field.Root>
                      <Field.Label>Email</Field.Label>
                      <Input value={user?.email || ''} disabled />
                      <Field.HelperText>
                        Email cannot be changed
                      </Field.HelperText>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Position</Field.Label>
                      <Input value={user?.position || ''} disabled />
                      <Field.HelperText>
                        Position is set by your administrator
                      </Field.HelperText>
                    </Field.Root>

                    <Separator />

                    <form onSubmit={phoneForm.handleSubmit(handlePhoneUpdate)}>
                      <Field.Root invalid={!!phoneForm.formState.errors.phone}>
                        <Field.Label>Phone Number</Field.Label>
                        <Input
                          type="tel"
                          {...phoneForm.register('phone')}
                          placeholder="Enter your phone number"
                        />
                        {phoneForm.formState.errors.phone && (
                          <Field.ErrorText>
                            {phoneForm.formState.errors.phone.message}
                          </Field.ErrorText>
                        )}
                        <Field.HelperText>
                          You can update your phone number
                        </Field.HelperText>
                      </Field.Root>

                      <Button
                        type="submit"
                        colorPalette="blue"
                        loading={phoneForm.formState.isSubmitting}
                        mt={4}
                      >
                        <FiSave />
                        Update Phone
                      </Button>
                    </form>
                  </Stack>
                </Card.Body>
              </Card.Root>
            </Tabs.Content>

            <Tabs.Content value="photo">
              <Card.Root>
                <Card.Header>
                  <Heading size="md">Profile Photo</Heading>
                  <Text color="gray.600">
                    Upload a new profile photo (Max: 5MB, JPG/PNG)
                  </Text>
                </Card.Header>
                <Card.Body>
                  <VStack gap={6}>
                    <Box textAlign="center">
                      <Avatar.Root size="2xl">
                        <Avatar.Image src={previewUrl || user?.photo?.path} />
                        <Avatar.Fallback>
                          {user
                            ? `${user.firstName?.[0]}${user.lastName?.[0]}`
                            : 'U'}
                        </Avatar.Fallback>
                      </Avatar.Root>
                    </Box>

                    <VStack gap={4}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />

                      <HStack>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FiCamera />
                          Choose Photo
                        </Button>

                        {selectedFile && (
                          <Button
                            colorPalette="blue"
                            loading={photoUploading}
                            onClick={handlePhotoUpload}
                          >
                            <FiSave />
                            Upload Photo
                          </Button>
                        )}
                      </HStack>

                      {selectedFile && (
                        <Text fontSize="sm" color="gray.600">
                          Selected: {selectedFile.name}
                        </Text>
                      )}
                    </VStack>
                  </VStack>
                </Card.Body>
              </Card.Root>
            </Tabs.Content>

            <Tabs.Content value="password">
              <Card.Root>
                <Card.Header>
                  <Heading size="md">Change Password</Heading>
                  <Text color="gray.600">
                    Update your account password for security
                  </Text>
                </Card.Header>
                <Card.Body>
                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}
                  >
                    <Stack gap={4}>
                      <Field.Root
                        required
                        invalid={
                          !!passwordForm.formState.errors.currentPassword
                        }
                      >
                        <Field.Label>Current Password</Field.Label>
                        <Input
                          type="password"
                          {...passwordForm.register('currentPassword')}
                          placeholder="Enter current password"
                        />
                        {passwordForm.formState.errors.currentPassword && (
                          <Field.ErrorText>
                            {
                              passwordForm.formState.errors.currentPassword
                                .message
                            }
                          </Field.ErrorText>
                        )}
                      </Field.Root>

                      <Field.Root
                        required
                        invalid={!!passwordForm.formState.errors.newPassword}
                      >
                        <Field.Label>New Password</Field.Label>
                        <Input
                          type="password"
                          {...passwordForm.register('newPassword')}
                          placeholder="Enter new password"
                        />
                        {passwordForm.formState.errors.newPassword && (
                          <Field.ErrorText>
                            {passwordForm.formState.errors.newPassword.message}
                          </Field.ErrorText>
                        )}
                        <Field.HelperText>
                          Password must be at least 6 characters long
                        </Field.HelperText>
                      </Field.Root>

                      <Field.Root
                        required
                        invalid={
                          !!passwordForm.formState.errors.confirmPassword
                        }
                      >
                        <Field.Label>Confirm New Password</Field.Label>
                        <Input
                          type="password"
                          {...passwordForm.register('confirmPassword')}
                          placeholder="Confirm new password"
                        />
                        {passwordForm.formState.errors.confirmPassword && (
                          <Field.ErrorText>
                            {
                              passwordForm.formState.errors.confirmPassword
                                .message
                            }
                          </Field.ErrorText>
                        )}
                      </Field.Root>

                      <Button
                        type="submit"
                        colorPalette="blue"
                        loading={passwordForm.formState.isSubmitting}
                      >
                        <FiSave />
                        Update Password
                      </Button>
                    </Stack>
                  </form>
                </Card.Body>
              </Card.Root>
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
