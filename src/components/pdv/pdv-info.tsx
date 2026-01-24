'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Customer, Employee } from '@/lib/types';
import { User, Clock, Calendar, Store } from 'lucide-react';

interface PdvInfoProps {
  selectedCustomer: Customer | null;
  authenticatedEmployee: Employee | null;
  lastAction: string;
  className?: string;
}

export function PdvInfo({
  selectedCustomer,
  authenticatedEmployee,
  lastAction,
  className = ''
}: PdvInfoProps) {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  const { date, time } = formatDateTime(currentDateTime);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Data e Hora */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono">{time}</span>
            </div>
          </div>

          {/* Funcionário autenticado */}
          {authenticatedEmployee && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">
                  {authenticatedEmployee.firstName} {authenticatedEmployee.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {authenticatedEmployee.role} • {authenticatedEmployee.employeeCode}
                </div>
              </div>
            </div>
          )}

          {/* Cliente selecionado */}
          {selectedCustomer && (
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </div>
                {selectedCustomer.email && (
                  <div className="text-xs text-muted-foreground">
                    {selectedCustomer.email}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status/Última ação */}
          <div className="pt-2 border-t">
            <Badge variant="secondary" className="text-xs">
              {lastAction}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}