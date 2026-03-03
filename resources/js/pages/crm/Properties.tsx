import { Head } from '@inertiajs/react';
import { Home, Plus } from 'lucide-react';
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

export default function Properties() {
    return (
        <>
            <Head title="Properties" />
            <CRMLayout
                title="Properties"
                description="Manage all your property listings"
            >
                <div className="flex flex-col gap-4 p-4 md:p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-2 md:flex-row md:gap-3 flex-1">
                            <Input
                                placeholder="Search properties..."
                                className="md:w-80"
                            />
                            <Select>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Properties
                                    </SelectItem>
                                    <SelectItem value="available">
                                        Available
                                    </SelectItem>
                                    <SelectItem value="sold">Sold</SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                            <Plus className="h-4 w-4" />
                            Add Property
                        </Button>
                    </div>

                    {/* Empty State */}
                    <Card className="flex flex-col items-center justify-center py-16 border-sidebar-border/70 dark:border-sidebar-border">
                        <Home className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No properties yet
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Start by adding your first property to get started
                        </p>
                        <Button className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                            <Plus className="h-4 w-4" />
                            Add Your First Property
                        </Button>
                    </Card>
                </div>
            </CRMLayout>
        </>
    );
}
