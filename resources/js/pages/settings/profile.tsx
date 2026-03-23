import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import { getCsrfToken } from '@/lib/csrf';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit(),
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Profile information"
                        description="Update your personal and professional agent details"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        headers={{
                            'X-CSRF-TOKEN': getCsrfToken() || '',
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors, data, setData }) => (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>

                                        <Input
                                            id="name"
                                            className="mt-1 block w-full"
                                            defaultValue={user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                        />

                                        <InputError
                                            className="mt-2"
                                            message={errors.name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email address</Label>

                                        <Input
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            defaultValue={user.email}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="Email address"
                                        />

                                        <InputError
                                            className="mt-2"
                                            message={errors.email}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone Number</Label>

                                        <Input
                                            id="phone"
                                            type="tel"
                                            className="mt-1 block w-full"
                                            defaultValue={user.phone}
                                            name="phone"
                                            placeholder="+7 (999) 000-00-00"
                                        />

                                        <InputError
                                            className="mt-2"
                                            message={errors.phone}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="license_number">License Number / ID</Label>

                                        <Input
                                            id="license_number"
                                            className="mt-1 block w-full"
                                            defaultValue={user.license_number}
                                            name="license_number"
                                            placeholder="RE-1234456"
                                        />

                                        <InputError
                                            className="mt-2"
                                            message={errors.license_number}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="specialization">Primary Specialization</Label>
                                        
                                        <Select 
                                            defaultValue={user.specialization || "residential"} 
                                            onValueChange={(val) => setData('specialization', val)}
                                        >
                                            <SelectTrigger className="mt-1 block w-full">
                                                <SelectValue placeholder="Select a specialization" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="residential">Residential Sales</SelectItem>
                                                <SelectItem value="commercial">Commercial Real Estate</SelectItem>
                                                <SelectItem value="luxury">Luxury Estate</SelectItem>
                                                <SelectItem value="rentals">Rentals & Management</SelectItem>
                                                <SelectItem value="land">Land & Development</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <input type="hidden" name="specialization" value={data.specialization ?? user.specialization ?? ''} />

                                        <InputError
                                            className="mt-2"
                                            message={errors.specialization}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="avatar_url">Photo URL</Label>

                                        <Input
                                            id="avatar_url"
                                            type="url"
                                            className="mt-1 block w-full"
                                            defaultValue={user.avatar_url}
                                            name="avatar_url"
                                            placeholder="https://example.com/avatar.jpg"
                                        />

                                        <InputError
                                            className="mt-2"
                                            message={errors.avatar_url}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="bio">Professional Bio</Label>

                                    <Textarea
                                        id="bio"
                                        className="mt-1 block w-full"
                                        defaultValue={user.bio}
                                        name="bio"
                                        rows={4}
                                        placeholder="Briefly describe your experience and approach..."
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.bio}
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <Heading
                                        variant="small"
                                        title="Social & Messengers"
                                        description="Direct links for client communication"
                                    />
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="telegram">Telegram Username</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">@</span>
                                                <Input
                                                    id="telegram"
                                                    className="pl-7"
                                                    defaultValue={user.social_links?.telegram}
                                                    name="social_links[telegram]"
                                                    placeholder="username"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid gap-2">
                                            <Label htmlFor="whatsapp">WhatsApp Number</Label>
                                            <Input
                                                id="whatsapp"
                                                defaultValue={user.social_links?.whatsapp}
                                                name="social_links[whatsapp]"
                                                placeholder="+7..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                        className="cursor-pointer"
                                    >
                                        Save changes
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-green-600 font-medium">
                                            Successfully saved!
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <div className="pt-8 border-t">
                    <DeleteUser />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
