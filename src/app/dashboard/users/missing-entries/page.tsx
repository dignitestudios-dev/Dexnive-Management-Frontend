"use client";
import { Loader } from "@/components/ui/loader";

import { useState } from "react";
import { format } from "date-fns";
import { useMissingEntriesQuery } from "@/features/worklogs/api/worklogs.queries";
import { useGetUsersQuery } from "@/features/users/api/users.queries";
import { Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function MissingEntriesPageContent() {
  const searchParams = useSearchParams();
  const defaultStartDate = () => {
    const d = new Date();
    d.setDate(1);
    return format(d, "yyyy-MM-dd");
  };
  const defaultEndDate = () => format(new Date(), "yyyy-MM-dd");

  const [draftFilters, setDraftFilters] = useState({
    user: searchParams.get("user") || "all_users",
    startDate: defaultStartDate(),
    endDate: defaultEndDate(),
  });
  const [appliedFilters, setAppliedFilters] = useState(draftFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [userComboOpen, setUserComboOpen] = useState(false);

  // Fetch users for dropdown
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery({ limit: 100 });

  useEffect(() => {
    if (usersData?.data && usersData.data.length > 0 && draftFilters.user === "all_users" && !searchParams.get("user")) {
      const firstUser = usersData.data[0]._id;
      setDraftFilters(p => ({ ...p, user: firstUser }));
      setAppliedFilters(p => ({ ...p, user: firstUser }));
    }
  }, [usersData, searchParams]);

  // Fetch missing entries
  const { data: missingData, isLoading: isMissingLoading, isError, refetch } = useMissingEntriesQuery({
    user: (appliedFilters.user && appliedFilters.user !== "all_users") ? appliedFilters.user : undefined,
    startDate: appliedFilters.startDate,
    endDate: appliedFilters.endDate
  });

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setIsFilterOpen(false);
  };
  
  const handleClearFilters = () => {
    const firstUser = usersData?.data?.[0]?._id || "all_users";
    const cleared = {
      user: firstUser,
      startDate: defaultStartDate(),
      endDate: defaultEndDate(),
    };
    setDraftFilters(cleared);
    setAppliedFilters(cleared);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Missing Entries</h1>
            <p className="text-sm text-gray-500 mt-1">Track and review missing worklog entries for users</p>
          </div>
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger render={
              <Button variant="outline" className="gap-2 h-9">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Filter Missing Entries</DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Select User</label>
                  <Popover open={userComboOpen} onOpenChange={setUserComboOpen}>
                    <PopoverTrigger render={
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userComboOpen}
                        className="w-full justify-between h-10 font-normal text-sm bg-white"
                      >
                        {draftFilters.user && draftFilters.user !== "all_users"
                          ? usersData?.data.find((user) => user._id === draftFilters.user)?.name
                          : "All Users (My Missing Entries)"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    } />
                    <PopoverContent className="w-[450px] p-0 z-[100]" align="start">
                      <Command>
                        <CommandInput placeholder="Search user by name..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all_users"
                              onSelect={() => {
                                setDraftFilters(p => ({ ...p, user: "all_users" }));
                                setUserComboOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  draftFilters.user === "all_users" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              All Users (My Missing Entries)
                            </CommandItem>
                            {usersData?.data.map((user) => (
                              <CommandItem
                                key={user._id}
                                value={user.name + " " + user._id}
                                onSelect={() => {
                                  setDraftFilters(p => ({ ...p, user: user._id }));
                                  setUserComboOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    draftFilters.user === user._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {user.name} <span className="text-gray-400 text-xs ml-2">({user.employeeCode || "N/A"})</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Start Date</label>
                    <Input 
                      type="date" 
                      value={draftFilters.startDate} 
                      onChange={(e) => setDraftFilters(p => ({ ...p, startDate: e.target.value }))} 
                      className="bg-white h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">End Date</label>
                    <Input 
                      type="date" 
                      value={draftFilters.endDate} 
                      onChange={(e) => setDraftFilters(p => ({ ...p, endDate: e.target.value }))} 
                      className="bg-white h-10"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setIsFilterOpen(false)} className="h-10">Cancel</Button>
                <Button onClick={handleApplyFilters} className="h-10">Apply Filters</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Applied Filters Display */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Applied Filters:</span>
          
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm">
            Date: {appliedFilters.startDate} to {appliedFilters.endDate}
          </span>
          
          {appliedFilters.user !== "all_users" && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary-50 text-primary-700 text-xs font-medium border border-primary-100">
              User: {usersData?.data.find((u) => u._id === appliedFilters.user)?.name || "Unknown"}
              <button onClick={() => { setDraftFilters(p => ({ ...p, user: "all_users" })); setAppliedFilters(p => ({ ...p, user: "all_users" })); }} className="ml-1.5 hover:text-primary-900"><X className="w-3 h-3" /></button>
            </span>
          )}
          
          {(appliedFilters.user !== "all_users" || appliedFilters.startDate !== defaultStartDate() || appliedFilters.endDate !== defaultEndDate()) && (
            <Button variant="ghost" size="xs" onClick={handleClearFilters} className="text-gray-500 hover:text-gray-900 h-6 px-2 text-xs ml-auto">
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
        {isMissingLoading || isUsersLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader className="w-8 h-8 mb-4 text-primary" />
            <p>Loading missing entries...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <AlertCircle className="w-8 h-8 mb-4" />
            <p>Failed to load missing entries.</p>
          </div>
        ) : missingData?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No missing entries</h3>
            <p className="text-sm text-gray-500">All worklogs are up to date for this period.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {missingData?.data.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {format(new Date(entry.shiftDate), "EEEE, MMMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Missing
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MissingEntriesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center">
        <Loader className="h-8 w-8 text-primary-500" />
      </div>
    }>
      <MissingEntriesPageContent />
    </Suspense>
  );
}


