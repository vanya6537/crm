import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/radix/dropdown-menu';
import { useSidebar } from '@/components/radix/sidebar';
import { UserInfo } from '@/components/user-info';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const { setOpenMobile, isMobile } = useSidebar();
    const { csrf_token } = usePage().props;

    const handleLogout = () => {
        if (isMobile) setOpenMobile(false);
        router.post(logout(), { _token: csrf_token });
    };

    const handleNavigation = () => {
        if (isMobile) setOpenMobile(false);
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem>
                    <Link
                        className="flex w-full cursor-pointer items-center"
                        href={edit()}
                        prefetch
                        onClick={handleNavigation}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="flex w-full cursor-pointer items-center"
                onSelect={handleLogout}
            >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
            </DropdownMenuItem>
        </>
    );
}
