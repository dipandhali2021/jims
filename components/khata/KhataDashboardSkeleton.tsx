import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export function KhataDashboardSkeleton() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" disabled>Overview</TabsTrigger>
            <TabsTrigger value="karigar" disabled>Karigar</TabsTrigger>
            <TabsTrigger value="vyapari" disabled>Vyapari</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            {/* Skeleton for Approvals Counter */}
            <div className="w-full mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-44 mb-2" />
                </CardHeader>
                <CardContent className="grid gap-4 pt-0 sm:grid-cols-2 lg:grid-cols-4">
                  {Array(4).fill(null).map((_, i) => (
                    <div key={`approval-${i}`} className="flex items-center gap-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            
            {/* Skeleton for Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {Array(4).fill(null).map((_, i) => (
                <Card key={`stat-${i}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                    <Skeleton className="h-9 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Skeleton for Comparison Cards */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {Array(2).fill(null).map((_, i) => (
                <Card key={`comparison-${i}`}>
                  <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
                    <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col items-center gap-2 border-r pr-6">
                        <Skeleton className="h-6 w-6 rounded-full mb-1" />
                        <Skeleton className="h-5 w-20 mb-1" />
                        <Skeleton className="h-7 w-28" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full mb-1" />
                        <Skeleton className="h-5 w-20 mb-1" />
                        <Skeleton className="h-7 w-28" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Skeleton for Charts */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {Array(2).fill(null).map((_, i) => (
                <Card key={`chart-${i}`}>
                  <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                    <CardDescription><Skeleton className="h-4 w-56" /></CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Skeleton for Transaction Table */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        {Array(6).fill(null).map((_, i) => (
                          <th key={`th-${i}`} className="p-3 text-left">
                            <Skeleton className="h-4 w-16" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array(5).fill(null).map((_, i) => (
                        <tr key={`tr-${i}`} className="border-b">
                          {Array(6).fill(null).map((_, j) => (
                            <td key={`td-${i}-${j}`} className="p-3">
                              <Skeleton className={`h-4 w-${[12, 16, 24, 32, 20, 16][j]}`} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
