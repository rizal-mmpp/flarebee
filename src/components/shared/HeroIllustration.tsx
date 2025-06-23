
'use client';

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Line, LineChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, MoreHorizontal, ArrowRight } from 'lucide-react';

const pieChartData = [
  { name: 'Organic', value: 400 },
  { name: 'Social', value: 300 },
  { name: 'Referral', value: 300 },
  { name: 'Direct', value: 200 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const lineChartData = [
  { name: 'Jan', uv: 200 },
  { name: 'Feb', uv: 300 },
  { name: 'Mar', uv: 250 },
  { name: 'Apr', uv: 400 },
  { name: 'May', uv: 350 },
  { name: 'Jun', uv: 450 },
];

const UserAvatar = ({ src, fallback, hint }: { src: string; fallback: string, hint?: string }) => (
  <Avatar className="h-6 w-6">
    <AvatarImage src={src} data-ai-hint={hint} />
    <AvatarFallback>{fallback}</AvatarFallback>
  </Avatar>
);

export function HeroIllustration() {
  return (
    <div className="relative h-[450px] w-full max-w-2xl mx-auto">
      {/* Card 1: Back Left */}
      <Card
        className="absolute w-[280px] p-4 shadow-xl animate-float"
        style={{ top: '10%', left: '0%', transform: 'rotate(-10deg)', animationDelay: '0.5s' }}
      >
        <CardHeader className="p-0 mb-2 flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Project Onboarding</CardTitle>
          <Badge variant="secondary" className="text-xs">In Progress</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-xs text-muted-foreground mb-3">Client discovery and initial mockups.</p>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center -space-x-2">
              <UserAvatar src="https://placehold.co/32x32.png" fallback="A" hint="woman smiling"/>
              <UserAvatar src="https://placehold.co/32x32.png" fallback="B" hint="man glasses"/>
              <UserAvatar src="https://placehold.co/32x32.png" fallback="C" hint="person sideprofile"/>
            </div>
            <span className="text-primary font-semibold flex items-center">
              View Project <ArrowRight className="ml-1 h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Main Center */}
      <Card
        className="absolute w-[320px] p-4 shadow-2xl animate-float z-10"
        style={{ top: '20%', left: '50%', transform: 'translateX(-50%)' }}
      >
        <CardHeader className="p-0 mb-3 flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <UserAvatar src="https://placehold.co/32x32.png" fallback="D" hint="man portrait"/>
            <p className="text-sm font-medium">Quarterly Growth</p>
          </div>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          <p className="text-4xl font-bold">1,450</p>
          <p className="text-sm text-muted-foreground">New users this quarter, exceeding projections by 15%.</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={20} outerRadius={35} dataKey="value" stroke="none">
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-semibold flex items-center">Revenue <ArrowUp className="h-4 w-4 text-green-500 ml-1" /> 12.1%</p>
              <p className="text-muted-foreground">$85,210.00</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Right floating */}
      <Card
        className="absolute w-[260px] p-3 shadow-xl animate-float"
        style={{ top: '5%', right: '0%', transform: 'rotate(8deg)', animationDelay: '0.2s' }}
      >
        <CardContent className="p-0 space-y-3">
          <div className="flex items-center gap-2">
            <UserAvatar src="https://placehold.co/32x32.png" fallback="E" hint="woman portrait"/>
            <p className="text-sm font-medium">Sent proposal to Acme Inc.</p>
          </div>
          <div className="flex items-center gap-2">
            <UserAvatar src="https://placehold.co/32x32.png" fallback="F" hint="man profile"/>
            <p className="text-sm font-medium">Finalized Q3 marketing assets.</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Card 4: Bottom Right with Chart */}
      <Card
        className="absolute w-[300px] p-4 shadow-xl animate-float"
        style={{ bottom: '0%', right: '5%', transform: 'rotate(5deg)', animationDelay: '0.8s' }}
      >
        <CardHeader className="p-0 mb-2">
            <CardTitle className="text-lg font-bold">User Engagement</CardTitle>
            <p className="text-sm text-muted-foreground">Weekly active users</p>
        </CardHeader>
        <CardContent className="p-0">
            <div className="h-20 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <Line type="monotone" dataKey="uv" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))', 
                                borderRadius: 'var(--radius)',
                                fontSize: '12px',
                                padding: '4px 8px'
                            }} 
                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
