import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IndexPage } from '@/components/ui/index-page';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HRLayout from '@/layouts/hr-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Edit, RefreshCw, Wallet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface LeaveType {
    id: number;
    code: string;
    name: string;
    color: string;
    default_quota: number;
}

interface Balance {
    leave_type_id: number;
    leave_type_name: string;
    leave_type_code: string;
    leave_type_color: string;
    initial_balance: number;
    carry_over: number;
    adjustment: number;
    used: number;
    pending: number;
    total_balance: number;
    available_balance: number;
    has_balance_record: boolean;
}

interface EmployeeWithBalance {
    id: number;
    employee_id: string;
    name: string;
    organization_unit: string | null;
    job_category: string | null;
    balances: Balance[];
}

interface Unit {
    id: number;
    name: string;
}

interface Props {
    employees: {
        data: EmployeeWithBalance[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    leaveTypes: LeaveType[];
    units: Unit[];
    years: number[];
    filters: {
        search: string | null;
        unit_id: string | null;
        year: number;
        leave_type_id: string | null;
        per_page: number;
    };
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

export default function Index({ employees, leaveTypes, units, years, filters }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        unit_id: filters.unit_id || '',
        year: String(filters.year),
        leave_type_id: filters.leave_type_id || '',
    });
    const [initDialogOpen, setInitDialogOpen] = useState(false);
    const [carryOverPrevious, setCarryOverPrevious] = useState(true);
    const [isInitializing, setIsInitializing] = useState(false);

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);

        // Auto-apply for year and leave_type_id changes
        if (key === 'year' || key === 'leave_type_id' || key === 'unit_id') {
            router.get('/hr/leave-balances', newFilters, { preserveState: true });
        }
    };

    const handleFilterSubmit = () => {
        router.get('/hr/leave-balances', filterValues, { preserveState: true });
    };

    const handleFilterReset = () => {
        const defaultFilters = { search: '', unit_id: '', year: String(new Date().getFullYear()), leave_type_id: '' };
        setFilterValues(defaultFilters);
        router.get('/hr/leave-balances', defaultFilters, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/hr/leave-balances', { ...filterValues, page }, { preserveState: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/hr/leave-balances', { ...filterValues, per_page: perPage, page: 1 }, { preserveState: true });
    };

    const handleInitializeYear = () => {
        setIsInitializing(true);
        router.post(
            '/hr/leave-balances/initialize',
            {
                year: parseInt(filterValues.year),
                carry_over_previous: carryOverPrevious,
            },
            {
                onSuccess: () => {
                    setInitDialogOpen(false);
                },
                onError: () => {
                    toast.error('Gagal menginisialisasi saldo cuti');
                },
                onFinish: () => {
                    setIsInitializing(false);
                },
            },
        );
    };

    const navigateYear = (direction: 'prev' | 'next') => {
        const currentYear = parseInt(filterValues.year);
        const newYear = direction === 'prev' ? currentYear - 1 : currentYear + 1;
        handleFilterChange('year', String(newYear));
    };

    // Build columns dynamically based on selected leave type or all leave types
    const selectedLeaveType = filterValues.leave_type_id ? leaveTypes.find((lt) => lt.id === parseInt(filterValues.leave_type_id)) : null;

    const baseColumns = [
        {
            key: 'employee_id',
            label: 'NIP',
            className: 'w-[100px]',
            render: (item: EmployeeWithBalance) => <span className="font-mono text-sm">{item.employee_id}</span>,
        },
        {
            key: 'name',
            label: 'Nama Karyawan',
            render: (item: EmployeeWithBalance) => (
                <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                        {item.organization_unit || '-'} • {item.job_category || '-'}
                    </div>
                </div>
            ),
        },
    ];

    // If specific leave type is selected, show detailed columns
    const balanceColumns = selectedLeaveType
        ? [
              {
                  key: 'initial',
                  label: 'Kuota Awal',
                  className: 'text-center w-[90px]',
                  render: (item: EmployeeWithBalance) => {
                      const balance = item.balances.find((b) => b.leave_type_id === selectedLeaveType.id);
                      return <span className="block text-center">{balance?.initial_balance ?? 0}</span>;
                  },
              },
              {
                  key: 'carry_over',
                  label: 'Carry Over',
                  className: 'text-center w-[90px]',
                  render: (item: EmployeeWithBalance) => {
                      const balance = item.balances.find((b) => b.leave_type_id === selectedLeaveType.id);
                      return <span className="block text-center">{balance?.carry_over ?? 0}</span>;
                  },
              },
              {
                  key: 'adjustment',
                  label: 'Penyesuaian',
                  className: 'text-center w-[90px]',
                  render: (item: EmployeeWithBalance) => {
                      const balance = item.balances.find((b) => b.leave_type_id === selectedLeaveType.id);
                      const adj = balance?.adjustment ?? 0;
                      return (
                          <span className={`block text-center ${adj > 0 ? 'text-green-600' : adj < 0 ? 'text-red-600' : ''}`}>
                              {adj > 0 ? '+' : ''}
                              {adj}
                          </span>
                      );
                  },
              },
              {
                  key: 'total',
                  label: 'Total',
                  className: 'text-center w-[80px]',
                  render: (item: EmployeeWithBalance) => {
                      const balance = item.balances.find((b) => b.leave_type_id === selectedLeaveType.id);
                      return <span className="block text-center font-medium">{balance?.total_balance ?? 0}</span>;
                  },
              },
              {
                  key: 'used',
                  label: 'Terpakai',
                  className: 'text-center w-[80px]',
                  render: (item: EmployeeWithBalance) => {
                      const balance = item.balances.find((b) => b.leave_type_id === selectedLeaveType.id);
                      return <span className="block text-center text-orange-600">{balance?.used ?? 0}</span>;
                  },
              },
              {
                  key: 'pending',
                  label: 'Pending',
                  className: 'text-center w-[80px]',
                  render: (item: EmployeeWithBalance) => {
                      const balance = item.balances.find((b) => b.leave_type_id === selectedLeaveType.id);
                      return <span className="block text-center text-yellow-600">{balance?.pending ?? 0}</span>;
                  },
              },
              {
                  key: 'available',
                  label: 'Sisa',
                  className: 'text-center w-[80px]',
                  render: (item: EmployeeWithBalance) => {
                      const balance = item.balances.find((b) => b.leave_type_id === selectedLeaveType.id);
                      const available = balance?.available_balance ?? 0;
                      return <Badge className={available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{available}</Badge>;
                  },
              },
          ]
        : leaveTypes.map((lt) => ({
              key: `balance_${lt.id}`,
              label: lt.code,
              className: 'text-center w-[80px]',
              render: (item: EmployeeWithBalance) => {
                  const balance = item.balances.find((b) => b.leave_type_id === lt.id);
                  const available = balance?.available_balance ?? lt.default_quota;
                  return (
                      <div className="text-center">
                          <div
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                                  available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                          >
                              <div className={`h-2 w-2 rounded-full ${colorClasses[lt.color] || 'bg-gray-500'}`}></div>
                              {available}
                          </div>
                      </div>
                  );
              },
          }));

    const actionColumn = {
        key: 'actions',
        label: '',
        className: 'w-[60px]',
        render: (item: EmployeeWithBalance) => (
            <Button variant="ghost" size="icon" asChild>
                <Link href={`/hr/leave-balances/${item.id}/edit?year=${filterValues.year}`}>
                    <Edit className="h-4 w-4" />
                </Link>
            </Button>
        ),
    };

    const columns = [...baseColumns, ...balanceColumns, actionColumn];

    // Year navigation component
    const yearNavigation = (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateYear('prev')}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={filterValues.year} onValueChange={(val) => handleFilterChange('year', val)}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {years.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                            {year}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => navigateYear('next')}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );

    return (
        <HRLayout>
            <Head title="Saldo Cuti" />

            <IndexPage
                title="Saldo Cuti"
                description={`Saldo cuti karyawan tahun ${filterValues.year}`}
                actions={[
                    {
                        label: 'Inisialisasi Tahun',
                        onClick: () => setInitDialogOpen(true),
                        icon: RefreshCw,
                        variant: 'outline',
                    },
                ]}
                searchValue={filterValues.search}
                searchPlaceholder="Cari karyawan..."
                onSearchChange={(value) => handleFilterChange('search', value)}
                columns={columns}
                data={employees.data}
                pagination={{
                    current_page: employees.current_page,
                    last_page: employees.last_page,
                    per_page: employees.per_page,
                    total: employees.total,
                    from: employees.from,
                    to: employees.to,
                }}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                filterFields={[
                    {
                        key: 'unit_id',
                        type: 'select',
                        placeholder: 'Unit',
                        options: units.map((u) => ({ value: String(u.id), label: u.name })),
                    },
                    {
                        key: 'leave_type_id',
                        type: 'select',
                        placeholder: 'Jenis Cuti',
                        options: leaveTypes.map((lt) => ({ value: String(lt.id), label: lt.name })),
                    },
                ]}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                headerExtra={yearNavigation}
                emptyMessage="Tidak ada data karyawan"
                emptyIcon={Wallet}
            />

            {/* Initialize Year Dialog */}
            <Dialog open={initDialogOpen} onOpenChange={setInitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Inisialisasi Saldo Cuti</DialogTitle>
                        <DialogDescription>
                            Inisialisasi saldo cuti untuk semua karyawan aktif pada tahun {filterValues.year}. Saldo yang sudah ada tidak akan
                            ditimpa.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="carry_over"
                                checked={carryOverPrevious}
                                onCheckedChange={(checked) => setCarryOverPrevious(checked as boolean)}
                            />
                            <Label htmlFor="carry_over">Carry over sisa saldo dari tahun sebelumnya (sesuai pengaturan jenis cuti)</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInitDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleInitializeYear} disabled={isInitializing}>
                            {isInitializing ? 'Memproses...' : 'Inisialisasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </HRLayout>
    );
}
