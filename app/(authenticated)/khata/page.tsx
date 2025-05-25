'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  Users, 
  UserCircle, 
  FileText, 
  CreditCard, 
  ShoppingBag, 
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useClerk } from '@clerk/nextjs';
import { VyapariTab } from '@/components/khata/VyapariTab';
import { KarigarTab } from '@/components/khata/KarigarTab';

export default function KhataPage() {
  const { user } = useClerk();
  const router = useRouter();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const [activeTab, setActiveTab] = useState('vyapari');
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Khata Book</h1>
            <p className="text-muted-foreground">
              Manage your Vyapari and Karigar records, transactions, and payments.
            </p>
          </div>          <div className="flex flex-col sm:flex-row gap-2">
            {isAdmin && (
              <Button 
                className="flex items-center gap-2" 
                variant="default"
                onClick={() => router.push('/khata/approvals')}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Pending Approvals</span>
              </Button>
            )}
            <Button 
              className="flex items-center gap-2" 
              variant="outline"
              onClick={() => router.push('/khata/dashboard')}
            >
              <FileText className="h-4 w-4" />
              <span>View Dashboard</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="vyapari" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="vyapari" className="relative">
                <Users className="h-4 w-4 mr-2" />
                <span>Vyapari</span>
              </TabsTrigger>
              <TabsTrigger value="karigar">
                <UserCircle className="h-4 w-4 mr-2" />
                <span>Karigar</span>
              </TabsTrigger>
              {/* Will add Analytics tab in future */}
            </TabsList>
          </div>
          
          <div className="mt-4">
            <TabsContent value="vyapari" className="space-y-4">
              <VyapariTab isAdmin={isAdmin} />
            </TabsContent>
            
            <TabsContent value="karigar" className="space-y-4">
              <KarigarTab isAdmin={isAdmin} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
