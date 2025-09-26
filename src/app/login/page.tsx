'use client';

import {
  Alert,
  Button,
  Card,
  Container,
  Field,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useAuth } from '@/lib/auth/auth-context';
import { PublicRoute } from '@/lib/auth/protected-route';

// Validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData) => {
    clearErrors();

    try {
      const result = await login(data.email, data.password);
      if (!result.success) {
        setError('root', {
          type: 'manual',
          message: result.error || 'Login failed',
        });
      }
    } catch (_err) {
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred',
      });
    }
  };

  return (
    <PublicRoute>
      <Container
        maxWidth="md"
        height="100vh"
        display="flex"
        alignItems="center"
      >
        <Card.Root width="100%" maxWidth="400px" margin="0 auto">
          <Card.Header textAlign="center">
            <Heading size="lg" color="blue.600">
              Employee Login
            </Heading>
            <Text color="gray.600" mt={2}>
              Sign in to your company account
            </Text>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack gap={4}>
                {errors.root && (
                  <Alert.Root status="error">
                    <Alert.Indicator />
                    <Alert.Title>{errors.root.message}</Alert.Title>
                  </Alert.Root>
                )}

                <Field.Root required invalid={!!errors.email}>
                  <Field.Label>Company Email</Field.Label>
                  <Input
                    type="email"
                    {...register('email')}
                    placeholder="Enter your company email"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <Field.ErrorText>{errors.email.message}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root required invalid={!!errors.password}>
                  <Field.Label>Password</Field.Label>
                  <Input
                    type="password"
                    {...register('password')}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  {errors.password && (
                    <Field.ErrorText>{errors.password.message}</Field.ErrorText>
                  )}
                </Field.Root>

                <Button
                  type="submit"
                  colorPalette="blue"
                  width="100%"
                  loading={isSubmitting}
                  loadingText="Signing in..."
                  size="lg"
                >
                  Sign In
                </Button>
              </Stack>
            </form>
          </Card.Body>
        </Card.Root>
      </Container>
    </PublicRoute>
  );
}
