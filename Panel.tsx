import React from 'react';
import { ClipboardList, CheckCircle2, Package, AlertCircle, Settings2 } from 'lucide-react';

import { useStore } from './useStore';
import { Card } from './components/ui/Card';

export default function Panel({ recipes, statsRecetas, insumos, setView }: any) {
  const { role } = useStore();
  const estadisticas = [
    { label: 'Versiones Totales', value: statsRecetas?.total || recipes.length, icon: ClipboardList, color: 'text-business-orange', bg: 'bg-business-mustard/10', vista: 'recetas' },
    { label: 'Vigentes Aprobadas', value: statsRecetas?.aprobadas || 0, icon: CheckCircle2, color: 'text-business-olive', bg: 'bg-business-olive/10', vista: 'libro' },
    { label: 'Insumos', value: insumos.length, icon: Package, color: 'text-business-teal', bg: 'bg-business-teal/10', vista: 'inventario' },
    { label: 'En Revisión', value: statsRecetas?.pendientes || 0, icon: AlertCircle, color: 'text-business-orange', bg: 'bg-business-mustard/20', vista: 'aprobaciones' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <header>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-business-orange" />
          Panel de Control
        </h1>
        <p className="text-slate-500 font-medium text-[11px] mt-1 italic uppercase tracking-wider">Perfil: <span className="text-business-olive font-black">{role}</span></p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {estadisticas.map((stat, i) => (
          <Card 
            key={i} 
            padding="sm"
            hoverEffect
            onClick={() => setView(stat.vista)} 
            className="flex items-center gap-4 cursor-pointer hover:scale-[1.02]"
          >
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 leading-none mt-1">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
