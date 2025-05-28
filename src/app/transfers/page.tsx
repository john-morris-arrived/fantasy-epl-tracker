'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Transfer = {
  id: number;
  squadId: number;
  squadName: string;
  type: string;
  playerId: number;
  playerName: string;
  action: string;
  date: string;
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/transfers');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const transfersData = await response.json();
        setTransfers(transfersData);
      } catch (err) {
        console.error('Error fetching transfers:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch transfers');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  const getActionBadge = (action: string) => {
    return action === 'added' ? (
      <Badge variant="default" className="bg-green-500">Added</Badge>
    ) : (
      <Badge variant="destructive">Removed</Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      goalkeeper: 'bg-blue-500',
      team: 'bg-purple-500',
      player: 'bg-orange-500'
    };
    
    return (
      <Badge variant="secondary" className={typeColors[type as keyof typeof typeColors] || 'bg-gray-500'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Transfer History</h1>
        <div className="text-center text-gray-500">Loading transfers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Transfer History</h1>
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!transfers.length) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Transfer History</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p>No transfers recorded yet.</p>
              <p className="text-sm mt-2">Transfer history will appear here when you edit squads.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Transfer History</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Squad</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Player/Team</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-mono text-sm">
                    {formatDate(transfer.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transfer.squadName}
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(transfer.type)}
                  </TableCell>
                  <TableCell>
                    {transfer.playerName}
                  </TableCell>
                  <TableCell>
                    {getActionBadge(transfer.action)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 