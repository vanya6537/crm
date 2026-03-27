import { Form, Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { isCsrfReady, waitForCsrf } from '@/lib/csrf';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/radix/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const { csrf_token } = usePage().props;
    const [csrfReady, setCsrfReady] = useState<boolean>(isCsrfReady());
    
    console.debug('[Login] CSRF Token from props:', csrf_token ? csrf_token.substring(0, 20) + '...' : 'MISSING');
    console.debug('[Login] CSRF Ready status:', csrfReady);
    
    // Wait for CSRF to be ready before allowing form submission
    useEffect(() => {
        console.debug('[Login] Setting up CSRF readiness check');
        
        if (isCsrfReady()) {
            console.debug('[Login] CSRF already ready');
            setCsrfReady(true);
            return;
        }
        
        console.debug('[Login] Waiting for CSRF to be ready...');
        waitForCsrf().then(() => {
            console.debug('[Login] CSRF is now ready');
            setCsrfReady(true);
        }).catch(error => {
            console.error('[Login] Error waiting for CSRF:', error);
            // Even if there's an error, mark as ready to allow form submission
            setCsrfReady(true);
        });
    }, []);
    
    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <input type="hidden" name="_token" value={csrf_token as string} />
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing || !csrfReady}
                                data-test="login-button"
                                title={!csrfReady ? 'Initializing security tokens...' : undefined}
                            >
                                {processing && <Spinner />}
                                {!csrfReady && !processing ? 'Initializing...' : 'Log in'}
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="text-center text-sm text-muted-foreground">
                                Don't have an account?{' '}
                                <TextLink href={register()} tabIndex={5}>
                                    Sign up
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
