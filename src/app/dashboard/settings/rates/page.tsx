"use client";
import { Loader } from "@/components/ui/loader";

import { useState } from "react";
import { DollarSign, Edit, Check } from "lucide-react";
import { useGetRatesQuery } from "@/features/rates/api/rates.queries";
import { useUpdateRatesMutation } from "@/features/rates/api/rates.mutations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useGetDepartmentsQuery } from "@/features/departments/api/departments.queries";

const MONTHS = [
  { id: 1, name: "Jan" }, { id: 2, name: "Feb" }, { id: 3, name: "Mar" },
  { id: 4, name: "Apr" }, { id: 5, name: "May" }, { id: 6, name: "Jun" },
  { id: 7, name: "Jul" }, { id: 8, name: "Aug" }, { id: 9, name: "Sep" },
  { id: 10, name: "Oct" }, { id: 11, name: "Nov" }, { id: 12, name: "Dec" },
];

export default function RatesPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Years from 2025 to current year + 1
  const years = Array.from({ length: Math.max(2, currentYear - 2025 + 2) }, (_, i) => (2025 + i).toString());

  const { data, isLoading } = useGetRatesQuery(parseInt(year));
  const ratesData = data?.data || [];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Rates Management</h1>
          <p className="text-sm text-gray-500">Manage monthly rates for departments (All amounts are in USD $)</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={(val) => setYear(val || "")}>
            <SelectTrigger className="w-28 bg-white h-9 shadow-sm">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsUpdateDialogOpen(true)} className="gap-2 bg-primary-600 hover:bg-primary-700 text-white">
            <Edit className="w-4 h-4" />
            Bulk Update Rates
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 custom-scrollbar bg-gray-50/30">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader className="w-6 h-6 text-gray-400" />
          </div>
        ) : ratesData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 border border-dashed rounded-lg bg-gray-50/50">
            <DollarSign className="w-8 h-8 mb-2 text-gray-400" />
            <p>No rates data found for {year}</p>
          </div>
        ) : (
          <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-gray-50/95 shadow-[1px_0_0_0_#e5e7eb] z-10">Department</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-center border-r">Default</th>
                    {MONTHS.map(m => (
                      <th key={m.id} className="px-4 py-3 font-medium text-center">{m.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ratesData.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50/50 shadow-[1px_0_0_0_#e5e7eb] z-10">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 font-mono border-r">
                        {row.defaultRate}
                      </td>
                      {MONTHS.map(m => (
                        <td key={m.id} className="px-4 py-3 text-center text-gray-700 font-mono">
                          {row.months[m.id] || row.defaultRate}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <UpdateRatesDialog 
        open={isUpdateDialogOpen} 
        onOpenChange={setIsUpdateDialogOpen} 
        year={parseInt(year)} 
      />
    </div>
  );
}

function UpdateRatesDialog({ open, onOpenChange, year }: { open: boolean, onOpenChange: (val: boolean) => void, year: number }) {
  const [rate, setRate] = useState<string>("");
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: deptData, isLoading: isLoadingDepts } = useGetDepartmentsQuery();
  const departments = deptData?.data || [];
  
  const updateMutation = useUpdateRatesMutation();

  const handleSave = () => {
    setError(null);
    if (!rate || isNaN(parseFloat(rate))) return setError("Please enter a valid rate amount.");
    if (selectedDepartments.length === 0) return setError("Please select at least one department.");
    if (selectedMonths.length === 0) return setError("Please select at least one month.");

    updateMutation.mutate({
      departmentIds: selectedDepartments,
      months: selectedMonths,
      year,
      rate: parseFloat(rate)
    }, {
      onSuccess: () => {
        toast.success("Rates updated successfully");
        onOpenChange(false);
        setRate("");
        setSelectedMonths([]);
        setSelectedDepartments([]);
        setError(null);
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || "Failed to update rates.");
      }
    });
  };

  const toggleMonth = (id: number) => {
    setSelectedMonths(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const toggleDept = (id: string) => {
    setSelectedDepartments(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const selectAllDepts = () => {
    if (selectedDepartments.length === departments.length) {
      setSelectedDepartments([]);
    } else {
      setSelectedDepartments(departments.map(d => d._id));
    }
  };

  const selectAllMonths = () => {
    if (selectedMonths.length === MONTHS.length) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths(MONTHS.map(m => m.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (val) setError(null); }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        {/* Header Section */}
        <div className="px-5 py-4 border-b border-gray-100 bg-white z-10 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary-600" />
              Bulk Update Rates for {year}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 mt-1">
            Apply new hourly rates across departments and months simultaneously.
          </p>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 bg-gray-50/50 space-y-5">
          
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Rate Input Section */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary-100 focus-within:border-primary-300">
            <label className="text-xs font-semibold text-gray-900 flex items-center gap-2 mb-2">
              New Hourly Rate
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium text-sm">$</span>
              </div>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={rate} 
                onChange={(e) => setRate(e.target.value)}
                className="pl-7 text-sm font-mono h-10 rounded-md border-gray-300 focus-visible:ring-primary-500"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-xs text-gray-400">USD/hr</span>
              </div>
            </div>
          </div>

          {/* Months Selection Section */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-900">Select Months</label>
              <button 
                onClick={selectAllMonths} 
                className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors cursor-pointer"
              >
                {selectedMonths.length === MONTHS.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {MONTHS.map(m => {
                const isSelected = selectedMonths.includes(m.id);
                return (
                  <div 
                    key={m.id}
                    onClick={() => toggleMonth(m.id)}
                    className={`flex items-center justify-center py-1.5 rounded-md border text-xs cursor-pointer transition-all duration-200 select-none ${isSelected ? 'bg-primary-600 border-primary-600 text-white shadow-sm scale-105' : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'}`}
                  >
                    {m.name}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Departments Selection Section */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <label className="text-xs font-semibold text-gray-900">Select Departments</label>
              <button 
                onClick={selectAllDepts} 
                className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors cursor-pointer"
              >
                {selectedDepartments.length === departments.length && departments.length > 0 ? "Deselect All" : "Select All"}
              </button>
            </div>
            
            {isLoadingDepts ? (
              <div className="flex-1 flex justify-center items-center">
                <Loader className="w-5 h-5 text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-1 max-h-[250px]">
                {departments.map((dept: any) => {
                  const isSelected = selectedDepartments.includes(dept._id);
                  return (
                    <label 
                      key={dept._id} 
                      className={`flex items-start gap-2.5 p-2 rounded-md border cursor-pointer transition-all duration-200 ${isSelected ? 'bg-primary-50/50 border-primary-200 ring-1 ring-primary-200' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className="flex h-4 items-center mt-[1px]">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleDept(dept._id)}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-medium transition-colors ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}>
                          {dept.name}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-0.5 font-mono">
                          Default: {dept.defaultRate}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer Section */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 z-10 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="px-4 text-xs h-8">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="bg-primary-600 hover:bg-primary-700 shadow-sm px-4 text-xs h-8">
            {updateMutation.isPending ? <Loader className="w-3 h-3 mr-1.5" /> : <Check className="w-3 h-3 mr-1.5" />}
            Update Rates
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


