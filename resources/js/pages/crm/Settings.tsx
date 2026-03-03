import { Head } from '@inertiajs/react';
import { Settings, Save } from 'lucide-react';
import CRMLayout from '@/layouts/crm-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function CRMSettings() {
    return (
        <>
            <Head title="CRM Settings" />
            <CRMLayout
                title="Settings"
                description="Manage your CRM preferences and configuration"
            >
                <div className="flex flex-col gap-6 p-4 md:p-6 max-w-2xl">
                    {/* Company Settings */}
                    <Card className="p-6 border-sidebar-border/70 dark:border-sidebar-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            Company Information
                        </h3>
                        <Separator className="mb-4" />
                        <div className="space-y-4">
                            <div>
                                <Label
                                    htmlFor="company-name"
                                    className="text-sm font-medium"
                                >
                                    Company Name
                                </Label>
                                <Input
                                    id="company-name"
                                    placeholder="Your company name"
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="company-email"
                                    className="text-sm font-medium"
                                >
                                    Company Email
                                </Label>
                                <Input
                                    id="company-email"
                                    type="email"
                                    placeholder="company@example.com"
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="company-phone"
                                    className="text-sm font-medium"
                                >
                                    Company Phone
                                </Label>
                                <Input
                                    id="company-phone"
                                    placeholder="+1 (555) 000-0000"
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Notification Settings */}
                    <Card className="p-6 border-sidebar-border/70 dark:border-sidebar-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            Notification Preferences
                        </h3>
                        <Separator className="mb-4" />
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-foreground">
                                        Email Notifications
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Receive email updates about transactions
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-slate-600 bg-slate-700"
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-foreground">
                                        Task Reminders
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Get reminded about upcoming tasks
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-slate-600 bg-slate-700"
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-foreground">
                                        Weekly Reports
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Receive weekly performance reports
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-slate-600 bg-slate-700"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Display Settings */}
                    <Card className="p-6 border-sidebar-border/70 dark:border-sidebar-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            Display Settings
                        </h3>
                        <Separator className="mb-4" />
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="currency" className="text-sm font-medium">
                                    Currency
                                </Label>
                                <Select defaultValue="usd">
                                    <SelectTrigger
                                        id="currency"
                                        className="mt-2"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="usd">
                                            USD ($)
                                        </SelectItem>
                                        <SelectItem value="eur">
                                            EUR (€)
                                        </SelectItem>
                                        <SelectItem value="gbp">
                                            GBP (£)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label
                                    htmlFor="date-format"
                                    className="text-sm font-medium"
                                >
                                    Date Format
                                </Label>
                                <Select defaultValue="mdy">
                                    <SelectTrigger
                                        id="date-format"
                                        className="mt-2"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mdy">
                                            MM/DD/YYYY
                                        </SelectItem>
                                        <SelectItem value="dmy">
                                            DD/MM/YYYY
                                        </SelectItem>
                                        <SelectItem value="ymd">
                                            YYYY-MM-DD
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    {/* Save Button */}
                    <Button className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white w-full md:w-auto">
                        <Save className="h-4 w-4" />
                        Save Settings
                    </Button>
                </div>
            </CRMLayout>
        </>
    );
}
