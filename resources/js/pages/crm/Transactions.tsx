import { Head } from '@inertiajs/react';
import { Calendar, Plus } from 'lucide-react';
import CRMLayout from '@/layouts/crm-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function Transactions() {
    return (
        <>
            <Head title="Transactions" />
            <CRMLayout
                title="Transactions"
                description="Track and manage all property transactions"
            >
                <div className="flex flex-col gap-4 p-4 md:p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-2 md:flex-row md:gap-3 flex-1">
                            <Input
                                placeholder="Search transactions..."
                                className="md:w-80"
                            />
                            <Select>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="in_progress">
                                        In Progress
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        Completed
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                            <Plus className="h-4 w-4" />
                            New Transaction
                        </Button>
                    </div>

                    {/* Empty State */}
                    <Card className="flex flex-col items-center justify-center py-16 border-sidebar-border/70 dark:border-sidebar-border">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No transactions yet
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first transaction to get started
                        </p>
                        <Button className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                            <Plus className="h-4 w-4" />
                            Create Your First Transaction
                        </Button>
                    </Card>
                </div>
            </CRMLayout>
        </>
    );
}
