import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  name: string;
  area: number;
}

function Index() {
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', x: 50, y: 50, width: 120, height: 80, type: 'living', name: 'Гостиная', area: 25.6 },
    { id: '2', x: 200, y: 50, width: 100, height: 80, type: 'kitchen', name: 'Кухня', area: 12.5 },
    { id: '3', x: 50, y: 150, width: 80, height: 100, type: 'bedroom', name: 'Спальня', area: 18.2 },
    { id: '4', x: 200, y: 150, width: 80, height: 60, type: 'bathroom', name: 'Ванная', area: 6.8 }
  ]);

  const tools = [
    { id: 'select', name: 'Выбор', icon: 'MousePointer' },
    { id: 'wall', name: 'Стена', icon: 'Minus' },
    { id: 'door', name: 'Дверь', icon: 'DoorOpen' },
    { id: 'room', name: 'Комната', icon: 'Square' },
    { id: 'corridor', name: 'Коридор', icon: 'ArrowRight' }
  ];

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
  };

  const getRoomColor = (type: string) => {
    const colors = {
      living: '#2563EB',
      kitchen: '#059669',
      bedroom: '#7C3AED',
      bathroom: '#DC2626',
      corridor: '#6B7280'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">ROOM EDITOR</h1>
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">Редактор</a>
                <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">Главная</a>
                <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">Проекты</a>
                <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">Библиотека</a>
                <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">Профиль</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить
              </Button>
              <Button size="sm">
                <Icon name="Share" size={16} className="mr-2" />
                Поделиться
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Tools Panel */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Инструменты</h3>
              <div className="space-y-2">
                {tools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant={selectedTool === tool.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTool(tool.id)}
                  >
                    <Icon name={tool.icon as any} size={16} className="mr-2" />
                    {tool.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Слои</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Стены</span>
                  <Icon name="Eye" size={14} className="text-gray-400" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Двери</span>
                  <Icon name="Eye" size={14} className="text-gray-400" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Комнаты</span>
                  <Icon name="Eye" size={14} className="text-gray-400" />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Размеры</h3>
              <div className="text-xs text-gray-600">
                <div>Масштаб: 1:100</div>
                <div>Сетка: 1м</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex">
          <div className="flex-1 bg-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-50">
              {/* Grid Pattern */}
              <svg className="absolute inset-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              
              {/* Room Plan SVG */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
                {/* Walls */}
                <g stroke="#1f2937" strokeWidth="3" fill="none">
                  <rect x="40" y="40" width="320" height="220" />
                  <line x1="170" y1="40" x2="170" y2="130" />
                  <line x1="170" y1="150" x2="170" y2="260" />
                  <line x1="40" y1="130" x2="130" y2="130" />
                  <line x1="150" y1="130" x2="360" y2="130" />
                </g>

                {/* Doors */}
                <g stroke="#059669" strokeWidth="2" fill="none">
                  <path d="M 130 130 A 20 20 0 0 1 150 130" />
                  <path d="M 170 130 A 20 20 0 0 1 170 150" />
                </g>

                {/* Room Rectangles */}
                {rooms.map((room) => (
                  <g key={room.id}>
                    <rect
                      x={room.x}
                      y={room.y}
                      width={room.width}
                      height={room.height}
                      fill={getRoomColor(room.type)}
                      fillOpacity="0.1"
                      stroke={getRoomColor(room.type)}
                      strokeWidth="2"
                      className="cursor-pointer hover:fill-opacity-20 transition-all"
                      onClick={() => handleRoomClick(room)}
                    />
                    <text
                      x={room.x + room.width / 2}
                      y={room.y + room.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-medium pointer-events-none"
                      fill={getRoomColor(room.type)}
                    >
                      {room.name}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-80 bg-white border-l border-gray-200 p-4">
            {selectedRoom ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedRoom.name}</h3>
                  <Badge variant="outline" style={{ color: getRoomColor(selectedRoom.type) }}>
                    {selectedRoom.type}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Площадь</label>
                    <p className="text-2xl font-bold text-gray-900">{selectedRoom.area} м²</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Ширина</label>
                      <p className="text-lg font-medium text-gray-900">{(selectedRoom.width / 10).toFixed(1)} м</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Длина</label>
                      <p className="text-lg font-medium text-gray-900">{(selectedRoom.height / 10).toFixed(1)} м</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Свойства</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Тип помещения:</span>
                      <span className="font-medium">{selectedRoom.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Освещение:</span>
                      <span className="font-medium">Естественное</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Вентиляция:</span>
                      <span className="font-medium">Приточная</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button className="w-full" variant="outline">
                    <Icon name="Settings" size={16} className="mr-2" />
                    Редактировать свойства
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <Icon name="MousePointer" size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Выберите комнату на плане для просмотра информации</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Координаты: 0, 0</span>
            <span>Масштаб: 100%</span>
            <span>Выбрано: {selectedRoom ? selectedRoom.name : 'Нет'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Готово к работе</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;