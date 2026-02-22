"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  FileDown,
  FileSpreadsheet,
  Search,
  CheckCircle,
  XCircle,
  DollarSign,
  Edit2,
  Trash2,
  Filter,
} from "lucide-react";
import { CostEntry, CostType, CostStatus } from "@prisma/client";
import {
  formatCurrency,
  COST_TYPE_CONFIG,
  COST_STATUS_CONFIG,
} from "@/lib/costs/cost-utils";

interface CostEntriesProps {
  entries: CostEntry[];
  filters: {
    selectedTypes: CostType[];
    setSelectedTypes: (types: CostType[]) => void;
    selectedStatuses: CostStatus[];
    setSelectedStatuses: (statuses: CostStatus[]) => void;
    dateRange: { start?: Date; end?: Date };
    setDateRange: (range: { start?: Date; end?: Date }) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
  };
  onEdit?: (entry: CostEntry) => void;
  onDelete?: (entryId: string) => void;
  onApprove?: (entryId: string) => void;
  onReject?: (entryId: string) => void;
  onMarkAsPaid?: (entryId: string) => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  isExportingCSV: boolean;
  isExportingExcel: boolean;
  isDeleting: boolean;
}

export function CostEntries({
  entries,
  filters,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onMarkAsPaid,
  onExportCSV,
  onExportExcel,
  isExportingCSV,
  isExportingExcel,
  isDeleting,
}: CostEntriesProps) {
  const [showFilters, setShowFilters] = useState(false);

  const getStatusBadge = (status: CostStatus) => {
    const config = COST_STATUS_CONFIG[status];
    return (
      <Badge variant={config.variant as any} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: CostType) => {
    return COST_TYPE_CONFIG[type].label;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={filters.searchQuery}
            onChange={(e) => filters.setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileDown className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportCSV} disabled={isExportingCSV}>
                <FileDown className="w-4 h-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExportExcel}
                disabled={isExportingExcel}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="w-full sm:w-auto">
            <label className="text-sm font-medium mb-1 block">Tipo</label>
            <Select
              value={filters.selectedTypes[0] || "all"}
              onValueChange={(value) =>
                filters.setSelectedTypes(
                  value === "all" ? [] : [value as CostType]
                )
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(COST_TYPE_CONFIG).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select
              value={filters.selectedStatuses[0] || "all"}
              onValueChange={(value) =>
                filters.setSelectedStatuses(
                  value === "all" ? [] : [value as CostStatus]
                )
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(COST_STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Valor Unit.</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum custo encontrado
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {format(new Date(entry.date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {entry.description}
                  </TableCell>
                  <TableCell>{getTypeLabel(entry.type)}</TableCell>
                  <TableCell>{entry.quantity}</TableCell>
                  <TableCell>
                    {formatCurrency(entry.unitPrice || entry.amount)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(entry.amount * entry.quantity)}
                  </TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(entry)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}

                        {onApprove && entry.status === "PENDING" && (
                          <DropdownMenuItem
                            onClick={() => onApprove(entry.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aprovar
                          </DropdownMenuItem>
                        )}

                        {onReject && entry.status === "PENDING" && (
                          <DropdownMenuItem onClick={() => onReject(entry.id)}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeitar
                          </DropdownMenuItem>
                        )}

                        {onMarkAsPaid &&
                          (entry.status === "APPROVED" ||
                            entry.status === "PENDING") && (
                            <DropdownMenuItem
                              onClick={() => onMarkAsPaid(entry.id)}
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Marcar como Pago
                            </DropdownMenuItem>
                          )}

                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(entry.id)}
                            className="text-red-600"
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
