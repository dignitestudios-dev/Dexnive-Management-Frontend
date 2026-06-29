import { Card } from "@/components/ui/card";
import { Users, Briefcase, Clock, Activity, TrendingUp, TrendingDown } from "lucide-react";

export function AdminDashboard() {
  const stats = [
    { title: "Total Users", value: "128", icon: <Users className="w-5 h-5 text-blue-500" />, trend: "+12%", up: true },
    { title: "Active Projects", value: "45", icon: <Briefcase className="w-5 h-5 text-indigo-500" />, trend: "+5%", up: true },
    { title: "Hours Logged", value: "3,210", icon: <Clock className="w-5 h-5 text-emerald-500" />, trend: "-2%", up: false },
    { title: "Efficiency", value: "87%", icon: <Activity className="w-5 h-5 text-amber-500" />, trend: "+4%", up: true },
  ];

  const barChartData = [
    { label: "Mon", height: "h-[40%]" },
    { label: "Tue", height: "h-[60%]" },
    { label: "Wed", height: "h-[80%]" },
    { label: "Thu", height: "h-[50%]" },
    { label: "Fri", height: "h-[90%]" },
    { label: "Sat", height: "h-[20%]" },
    { label: "Sun", height: "h-[10%]" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-5 border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium text-sm">{stat.title}</span>
              <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              <span className={`text-xs font-semibold flex items-center gap-1 ${stat.up ? "text-emerald-600" : "text-red-600"}`}>
                {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.trend}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-2 p-6 border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
            <p className="text-sm text-gray-500">Hours logged across all departments</p>
          </div>
          
          <div className="flex-1 min-h-[250px] flex items-end justify-between gap-2 pt-4 relative">
            {/* Y-axis lines (dummy) */}
            <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0 pointer-events-none">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-full border-t border-gray-100 border-dashed" />
              ))}
            </div>

            {barChartData.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 w-full z-10 group mt-auto">
                <div className="w-full flex justify-center items-end h-[200px]">
                  <div className={`w-3/4 max-w-[40px] bg-primary-500/80 hover:bg-primary-600 rounded-t-md transition-all duration-300 ${data.height}`} />
                </div>
                <span className="text-xs font-medium text-gray-500">{data.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Division Progress */}
        <Card className="p-6 border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Department Allocation</h3>
            <p className="text-sm text-gray-500">Resource distribution</p>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-6">
            {[
              { name: "Engineering", percent: "45%", color: "bg-blue-500" },
              { name: "Design", percent: "25%", color: "bg-purple-500" },
              { name: "Marketing", percent: "20%", color: "bg-emerald-500" },
              { name: "Management", percent: "10%", color: "bg-amber-500" },
            ].map((dept, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{dept.name}</span>
                  <span className="text-gray-500 font-semibold">{dept.percent}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${dept.color} rounded-full`} style={{ width: dept.percent }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
