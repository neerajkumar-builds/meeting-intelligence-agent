"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/format";
import type { ScoringRunLogRow } from "@/types/meetings";

interface ProcessingLogProps {
  logs: ScoringRunLogRow[];
}

export function ProcessingLog({ logs }: ProcessingLogProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-medium mb-2">Processing Log</h3>
          <p className="text-sm text-muted-foreground">
            No workflow runs logged yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium mb-4">Recent Workflow Runs</h3>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-center">Scored</TableHead>
                <TableHead className="text-center">Failed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs font-mono">
                    {log.workflow_name.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(log.run_started_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.meetings_scored}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.meetings_failed > 0 ? (
                      <span className="text-destructive font-medium">
                        {log.meetings_failed}
                      </span>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
                          : log.status === "running"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {log.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
