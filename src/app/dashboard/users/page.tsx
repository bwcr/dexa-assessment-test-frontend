'use client';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  Field,
  Heading,
  Input,
  NativeSelect,
  Spinner,
  Table,
  Text,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';

import { apiClient, type User } from '@/lib/api/client';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { DashboardLayout } from '@/lib/layout/dashboard-layout';

const roles = [
  { id: 1, name: 'Admin' },
  { id: 2, name: 'User' },
];

const statuses = [
  { id: 1, name: 'Active' },
  { id: 2, name: 'Inactive' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<Array<User>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    position: '',
    roleId: 1,
    statusId: 1,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiClient.getEmployees(1, 10);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setUsers(response.data.data);
      }
    } catch {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: next time
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    if (isEditing && editingUserId) {
      const data = {
        password: formData.password || undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        position: formData.position || undefined,
        role: {
          id: formData.roleId,
        },
        status: { id: formData.statusId },
      };

      const response = await apiClient.updateEmployee(editingUserId, data);
      if (response.error) {
        setCreateError(response.error);
      } else {
        setIsModalOpen(false);
        setIsEditing(false);
        setEditingUserId(null);
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: '',
          position: '',
          roleId: 1,
          statusId: 1,
        });
        await fetchUsers();
      }
    } else {
      const data = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        position: formData.position || undefined,
        role: { id: formData.roleId },
        status: { id: formData.statusId },
      };

      const response = await apiClient.createEmployee(data);
      if (response.error) {
        setCreateError(response.error);
      } else {
        setIsModalOpen(false);
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: '',
          position: '',
          roleId: 1,
          statusId: 1,
        });
        await fetchUsers();
      }
    }
    setCreating(false);
  };

  if (loading) {
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

  if (error) {
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
            Users
          </Heading>

          <Button onClick={() => setIsModalOpen(true)} mb={4}>
            Create User
          </Button>

          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>Avatar</Table.ColumnHeader>
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>First Name</Table.ColumnHeader>
                <Table.ColumnHeader>Last Name</Table.ColumnHeader>
                <Table.ColumnHeader>Phone</Table.ColumnHeader>
                <Table.ColumnHeader>Position</Table.ColumnHeader>
                <Table.ColumnHeader>Role</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Created At</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>{user.id}</Table.Cell>
                  <Table.Cell>
                    <Avatar.Root size="sm">
                      <Avatar.Fallback
                        name={`${user.firstName} ${user.lastName}`}
                      />
                      {user.photo?.path && (
                        <Avatar.Image src={user.photo.path} />
                      )}
                    </Avatar.Root>
                  </Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                  <Table.Cell>{user.firstName}</Table.Cell>
                  <Table.Cell>{user.lastName}</Table.Cell>
                  <Table.Cell>{user.phone || '-'}</Table.Cell>
                  <Table.Cell>{user.position || '-'}</Table.Cell>
                  <Table.Cell>{user.role.name}</Table.Cell>
                  <Table.Cell>{user.status.name}</Table.Cell>
                  <Table.Cell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsEditing(true);
                        setEditingUserId(user.id);
                        setFormData({
                          email: user.email,
                          password: '',
                          firstName: user.firstName,
                          lastName: user.lastName,
                          phone: user.phone || '',
                          position: user.position || '',
                          roleId: user.role.id,
                          statusId: user.status.id,
                        });
                        setIsModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          {users.length === 0 && (
            <Text textAlign="center" mt={8} color="gray.500">
              No users found
            </Text>
          )}
        </Box>

        <Dialog.Root
          open={isModalOpen}
          onOpenChange={(details) => {
            setIsModalOpen(details.open);
            if (!details.open) {
              setIsEditing(false);
              setEditingUserId(null);
              setFormData({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                phone: '',
                position: '',
                roleId: 1,
                statusId: 1,
              });
            }
          }}
        >
          <Dialog.Backdrop />
          <Dialog.Content
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            maxW="500px"
            w="90%"
            maxH="80vh"
            overflowY="auto"
          >
            <Dialog.Header>
              <Dialog.Title>
                {isEditing ? 'Edit User' : 'Create User'}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form onSubmit={handleSubmit}>
                <Field.Root mb={4}>
                  <Field.Label>Email</Field.Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </Field.Root>
                <Field.Root mb={4}>
                  <Field.Label>Password</Field.Label>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!isEditing}
                  />
                </Field.Root>
                <Field.Root mb={4}>
                  <Field.Label>First Name</Field.Label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </Field.Root>
                <Field.Root mb={4}>
                  <Field.Label>Last Name</Field.Label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </Field.Root>
                <Field.Root mb={4}>
                  <Field.Label>Phone</Field.Label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </Field.Root>
                <Field.Root mb={4}>
                  <Field.Label>Position</Field.Label>
                  <Input
                    name="position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                  />
                </Field.Root>
                <Field.Root mb={4}>
                  <Field.Label>Role</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      name="role"
                      value={formData.roleId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          roleId: Number(e.target.value),
                        })
                      }
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Field.Root>
                <Field.Root mb={4}>
                  <Field.Label>Status</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      name="status"
                      value={formData.statusId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statusId: Number(e.target.value),
                        })
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Field.Root>
                {createError && (
                  <Text color="red.500" mb={4}>
                    {createError}
                  </Text>
                )}
                <Button type="submit" loading={creating}>
                  {isEditing ? 'Update' : 'Create'}
                </Button>
              </form>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Root>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
