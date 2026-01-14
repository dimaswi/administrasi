import { Head, router, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Balance {
    leave_type_id: number;
    leave_type_name: string;
    leave_type_code: string;
    leave_type_color: string;
    default_quota: number;
    initial_balance: number;
    carry_over: number;
    adjustment: number;
    used: number;
    pending: number;
    total_balance: number;
    available_balance: number;
}

interface Employee {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
}

interface Props {
    employee: Employee;
    balances: Balance[];
    year: number;
    years: number[];
}

const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
    cyan: 'bg-cyan-500',
    gray: 'bg-gray-500',
};

export default function Edit({ employee, balances, year, years }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        year: year,
        balances: balances.map(b => ({
            leave_type_id: b.leave_type_id,
            initial_balance: b.initial_balance,
            carry_over: b.carry_over,
            adjustment: b.adjustment,
        })),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/hr/leave-balances/${employee.id}`, {
            onError: () => toast.error('Gagal memperbarui saldo cuti'),
        });
    };

    const handleYearChange = (newYear: string) => {
        router.get(`/hr/leave-balances/${employee.id}/edit`, { year: newYear });
    };

    const updateBalance = (index: number, field: string, value: number) => {
        const newBalances = [...data.balances];
        newBalances[index] = { ...newBalances[index], [field]: value };
        setData('balances', newBalances);
    };

    const calculateTotal = (index: number) => {
        const balance = data.balances[index];
        const initial = Number(balance.initial_balance) || 0;
        const carry = Number(balance.carry_over) || 0;
        const adj = Number(balance.adjustment) || 0;
        return initial + carry + adj;
    };

    const calculateAvailable = (index: number) => {
        const originalBalance = balances[index];
        const total = calculateTotal(index);
        const used = Number(originalBalance.used) || 0;
        const pending = Number(originalBalance.pending) || 0;
        return total - used - pending;
    };

    const formatNumber = (num: number) => {
        return Number.isInteger(num) ? num : num.toFixed(1);
    };

    return (
        <HRLayout>
            <Head title={`Edit Saldo Cuti - ${employee.name}`} />

            <FormPage
                title={`Edit Saldo Cuti`}
                description={`${employee.name} (${employee.employee_id})`}
                backUrl={`/hr/leave-balances?year=${year}`}
                onSubmit={handleSubmit}
                isLoading={processing}
            >
                {/* Year Selector */}
                <div className="flex items-center gap-4 mb-6">
                    <Label>Tahun</Label>
                    <Select value={String(year)} onValueChange={handleYearChange}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Employee Info */}
                <Card className="mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Informasi Karyawan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">NIP:</span>
                                <span className="ml-2 font-medium">{employee.employee_id}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Nama:</span>
                                <span className="ml-2 font-medium">{employee.name}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Unit:</span>
                                <span className="ml-2">{employee.organization_unit || '-'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Balances */}
                <div className="space-y-4">
                    {balances.map((balance, index) => (
                        <Card key={balance.leave_type_id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${colorClasses[balance.leave_type_color] || 'bg-gray-500'}`}></div>
                                        <CardTitle className="text-base">{balance.leave_type_name}</CardTitle>
                                        <Badge variant="outline">{balance.leave_type_code}</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Terpakai:</span>
                                            <span className="ml-1 font-medium text-orange-600">{formatNumber(Number(balance.used) || 0)}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Pending:</span>
                                            <span className="ml-1 font-medium text-yellow-600">{formatNumber(Number(balance.pending) || 0)}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Sisa:</span>
                                            <Badge className={calculateAvailable(index) > 0 ? 'bg-green-100 text-green-800 ml-1' : 'bg-red-100 text-red-800 ml-1'}>
                                                {formatNumber(calculateAvailable(index))}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`initial_${index}`}>Kuota Awal</Label>
                                        <Input
                                            id={`initial_${index}`}
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={data.balances[index].initial_balance}
                                            onChange={(e) => updateBalance(index, 'initial_balance', Number(e.target.value) || 0)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Default: {balance.default_quota} hari
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`carry_over_${index}`}>Carry Over</Label>
                                        <Input
                                            id={`carry_over_${index}`}
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={data.balances[index].carry_over}
                                            onChange={(e) => updateBalance(index, 'carry_over', Number(e.target.value) || 0)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Sisa tahun lalu
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`adjustment_${index}`}>Penyesuaian</Label>
                                        <Input
                                            id={`adjustment_${index}`}
                                            type="number"
                                            step="1"
                                            value={data.balances[index].adjustment}
                                            onChange={(e) => updateBalance(index, 'adjustment', Number(e.target.value) || 0)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Bisa negatif untuk pengurangan
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Total Saldo</Label>
                                        <div className="h-10 flex items-center">
                                            <span className="text-2xl font-bold">
                                                {formatNumber(calculateTotal(index))}
                                            </span>
                                            <span className="ml-1 text-muted-foreground">hari</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </FormPage>
        </HRLayout>
    );
}
