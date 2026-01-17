import { Head, router, useForm } from '@inertiajs/react';
import HRLayout from '@/layouts/hr-layout';
import { FormPage } from '@/components/ui/form-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
<<<<<<< HEAD
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Calendar, Clock, Minus, Plus, TrendingUp, User, Building2, Hash } from 'lucide-react';
=======
import { toast } from 'sonner';
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce

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
<<<<<<< HEAD
    is_assigned: boolean;
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
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

<<<<<<< HEAD
const colorBgClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
    pink: 'bg-pink-50 border-pink-200',
    orange: 'bg-orange-50 border-orange-200',
    cyan: 'bg-cyan-50 border-cyan-200',
    gray: 'bg-gray-50 border-gray-200',
};

const colorTextClasses: Record<string, string> = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700',
    purple: 'text-purple-700',
    pink: 'text-pink-700',
    orange: 'text-orange-700',
    cyan: 'text-cyan-700',
    gray: 'text-gray-700',
};

=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
export default function Edit({ employee, balances, year, years }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        year: year,
        balances: balances.map(b => ({
            leave_type_id: b.leave_type_id,
            initial_balance: b.initial_balance,
            carry_over: b.carry_over,
            adjustment: b.adjustment,
<<<<<<< HEAD
            is_assigned: b.is_assigned,
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
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

<<<<<<< HEAD
    const updateBalance = (index: number, field: string, value: number | boolean) => {
=======
    const updateBalance = (index: number, field: string, value: number) => {
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
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
<<<<<<< HEAD
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <Label className="font-medium">Tahun</Label>
                    </div>
=======
                    <Label>Tahun</Label>
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
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
<<<<<<< HEAD
                <Card className="mb-6 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-600" />
                            Informasi Karyawan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-6 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Hash className="h-4 w-4 text-slate-500" />
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs block">NIP</span>
                                    <span className="font-semibold">{employee.employee_id}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <User className="h-4 w-4 text-slate-500" />
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs block">Nama</span>
                                    <span className="font-semibold">{employee.name}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Building2 className="h-4 w-4 text-slate-500" />
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs block">Unit</span>
                                    <span className="font-semibold">{employee.organization_unit || '-'}</span>
                                </div>
=======
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
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Balances */}
                <div className="space-y-4">
<<<<<<< HEAD
                    {balances.map((balance, index) => {
                        const isAssigned = data.balances[index].is_assigned;
                        const hasUsage = (Number(balance.used) || 0) > 0 || (Number(balance.pending) || 0) > 0;
                        const colorBg = colorBgClasses[balance.leave_type_color] || 'bg-gray-50 border-gray-200';
                        const colorText = colorTextClasses[balance.leave_type_color] || 'text-gray-700';
                        
                        return (
                        <Card 
                            key={balance.leave_type_id} 
                            className={`transition-all duration-200 ${!isAssigned ? 'opacity-50 grayscale' : 'hover:shadow-md'} ${isAssigned ? colorBg : 'bg-gray-50 border-gray-200'} border-2`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={isAssigned}
                                            onCheckedChange={(checked) => updateBalance(index, 'is_assigned', checked)}
                                            disabled={hasUsage}
                                            title={hasUsage ? 'Tidak bisa dinonaktifkan karena sudah ada penggunaan' : ''}
                                        />
                                        <div className={`w-4 h-4 rounded-full ${colorClasses[balance.leave_type_color] || 'bg-gray-500'} shadow-sm`}></div>
                                        <CardTitle className={`text-base ${isAssigned ? colorText : 'text-gray-500'}`}>{balance.leave_type_name}</CardTitle>
                                        <Badge variant="outline" className="font-mono text-xs">{balance.leave_type_code}</Badge>
                                        {!isAssigned && <Badge variant="secondary" className="bg-gray-200">Tidak Aktif</Badge>}
                                    </div>
                                    {isAssigned && (
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-orange-100 rounded-md">
                                                <Clock className="h-3.5 w-3.5 text-orange-600" />
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground text-xs block">Terpakai</span>
                                                <span className="font-bold text-orange-600">{formatNumber(Number(balance.used) || 0)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-yellow-100 rounded-md">
                                                <Clock className="h-3.5 w-3.5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground text-xs block">Pending</span>
                                                <span className="font-bold text-yellow-600">{formatNumber(Number(balance.pending) || 0)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-md ${calculateAvailable(index) > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                                <TrendingUp className={`h-3.5 w-3.5 ${calculateAvailable(index) > 0 ? 'text-green-600' : 'text-red-600'}`} />
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground text-xs block">Sisa</span>
                                                <span className={`font-bold ${calculateAvailable(index) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatNumber(calculateAvailable(index))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    )}
                                </div>
                            </CardHeader>
                            {isAssigned && (
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`initial_${index}`} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <Plus className="h-3 w-3" />
                                            Kuota Awal
                                        </Label>
=======
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
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                        <Input
                                            id={`initial_${index}`}
                                            type="number"
                                            step="1"
                                            min="0"
<<<<<<< HEAD
                                            className="bg-white/80 border-2 focus:ring-2 focus:ring-offset-1"
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                            value={data.balances[index].initial_balance}
                                            onChange={(e) => updateBalance(index, 'initial_balance', Number(e.target.value) || 0)}
                                        />
                                        <p className="text-xs text-muted-foreground">
<<<<<<< HEAD
                                            Default: <span className="font-medium">{balance.default_quota}</span> hari
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`carry_over_${index}`} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <TrendingUp className="h-3 w-3" />
                                            Carry Over
                                        </Label>
=======
                                            Default: {balance.default_quota} hari
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`carry_over_${index}`}>Carry Over</Label>
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                        <Input
                                            id={`carry_over_${index}`}
                                            type="number"
                                            step="1"
                                            min="0"
<<<<<<< HEAD
                                            className="bg-white/80 border-2 focus:ring-2 focus:ring-offset-1"
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                            value={data.balances[index].carry_over}
                                            onChange={(e) => updateBalance(index, 'carry_over', Number(e.target.value) || 0)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Sisa tahun lalu
                                        </p>
                                    </div>
                                    <div className="space-y-2">
<<<<<<< HEAD
                                        <Label htmlFor={`adjustment_${index}`} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <Minus className="h-3 w-3" />
                                            Penyesuaian
                                        </Label>
=======
                                        <Label htmlFor={`adjustment_${index}`}>Penyesuaian</Label>
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                        <Input
                                            id={`adjustment_${index}`}
                                            type="number"
                                            step="1"
<<<<<<< HEAD
                                            className="bg-white/80 border-2 focus:ring-2 focus:ring-offset-1"
=======
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                            value={data.balances[index].adjustment}
                                            onChange={(e) => updateBalance(index, 'adjustment', Number(e.target.value) || 0)}
                                        />
                                        <p className="text-xs text-muted-foreground">
<<<<<<< HEAD
                                            Bisa negatif
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-muted-foreground">Total Saldo</Label>
                                        <div className="h-10 flex items-center bg-white/50 rounded-lg px-3 border-2 border-dashed">
                                            <span className={`text-2xl font-bold ${colorText}`}>
                                                {formatNumber(calculateTotal(index))}
                                            </span>
                                            <span className="ml-1.5 text-muted-foreground text-sm">hari</span>
=======
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
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
<<<<<<< HEAD
                            )}
                        </Card>
                    );
                    })}
=======
                        </Card>
                    ))}
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
                </div>
            </FormPage>
        </HRLayout>
    );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6f4b8d9e7ea73f29498b874347d8be79e963a0ce
