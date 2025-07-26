import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface Point {
  x: number;
  y: number;
}

interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
}

interface Door {
  id: string;
  position: Point;
  width: number;
  angle: number;
  wallId?: string;
}

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

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  type: 'walls' | 'doors' | 'rooms';
}

function Index() {
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedWall, setSelectedWall] = useState<Wall | null>(null);
  const [selectedDoor, setSelectedDoor] = useState<Door | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<Point | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomColor, setEditRoomColor] = useState('#2563EB');
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [layers, setLayers] = useState<Layer[]>([
    { id: 'walls', name: 'Стены', visible: true, type: 'walls' },
    { id: 'doors', name: 'Двери', visible: true, type: 'doors' },
    { id: 'rooms', name: 'Комнаты', visible: true, type: 'rooms' }
  ]);

  const [walls, setWalls] = useState<Wall[]>([
    { id: '1', start: { x: 40, y: 40 }, end: { x: 360, y: 40 }, thickness: 3 },
    { id: '2', start: { x: 360, y: 40 }, end: { x: 360, y: 260 }, thickness: 3 },
    { id: '3', start: { x: 360, y: 260 }, end: { x: 40, y: 260 }, thickness: 3 },
    { id: '4', start: { x: 40, y: 260 }, end: { x: 40, y: 40 }, thickness: 3 },
    { id: '5', start: { x: 170, y: 40 }, end: { x: 170, y: 130 }, thickness: 3 },
    { id: '6', start: { x: 170, y: 150 }, end: { x: 170, y: 260 }, thickness: 3 },
    { id: '7', start: { x: 40, y: 130 }, end: { x: 130, y: 130 }, thickness: 3 },
    { id: '8', start: { x: 150, y: 130 }, end: { x: 360, y: 130 }, thickness: 3 }
  ]);

  const [doors, setDoors] = useState<Door[]>([
    { id: '1', position: { x: 140, y: 130 }, width: 20, angle: 0 },
    { id: '2', position: { x: 170, y: 140 }, width: 20, angle: 90 }
  ]);

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

  // Обработка мыши для canvas
  const getMousePosition = useCallback((event: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;
    
    return { x, y };
  }, [pan, zoom]);

  // Привязка к углам для стен
  const snapToAngle = (start: Point, end: Point): Point => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return end;
    
    const angle = Math.atan2(dy, dx);
    const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4); // Привязка к 45°
    
    return {
      x: start.x + distance * Math.cos(snapAngle),
      y: start.y + distance * Math.sin(snapAngle)
    };
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const pos = getMousePosition(event);
    setMousePos(pos);

    if (selectedTool === 'select' && event.button === 1) {
      // Средняя кнопка мыши для панорамирования
      setIsPanning(true);
      event.preventDefault();
    } else if (selectedTool === 'wall' || selectedTool === 'room') {
      setIsDrawing(true);
      setDrawingStart(pos);
    } else if (selectedTool === 'door') {
      // Добавление двери
      const newDoor: Door = {
        id: Date.now().toString(),
        position: pos,
        width: 20,
        angle: 0
      };
      setDoors(prev => [...prev, newDoor]);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const pos = getMousePosition(event);
    setMousePos(pos);

    if (isPanning) {
      setPan(prev => ({
        x: prev.x + event.movementX,
        y: prev.y + event.movementY
      }));
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }
    
    if (isDrawing && drawingStart) {
      const pos = getMousePosition(event);
      
      if (selectedTool === 'wall') {
        // Привязка к углам и добавление стены
        const snappedEnd = snapToAngle(drawingStart, pos);
        const newWall: Wall = {
          id: Date.now().toString(),
          start: drawingStart,
          end: snappedEnd,
          thickness: 3
        };
        setWalls(prev => [...prev, newWall]);
      } else if (selectedTool === 'room') {
        // Добавление комнаты
        const newRoom: Room = {
          id: Date.now().toString(),
          x: Math.min(drawingStart.x, pos.x),
          y: Math.min(drawingStart.y, pos.y),
          width: Math.abs(pos.x - drawingStart.x),
          height: Math.abs(pos.y - drawingStart.y),
          type: 'room',
          name: `Комната ${rooms.length + 1}`,
          area: Math.round(Math.abs(pos.x - drawingStart.x) * Math.abs(pos.y - drawingStart.y) / 100 * 10) / 10
        };
        setRooms(prev => [...prev, newRoom]);
      }
      
      setIsDrawing(false);
      setDrawingStart(null);
    }
  };

  // Масштабирование колесом мыши
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
    setZoom(newZoom);
  };

  const handleRoomClick = (room: Room, event: React.MouseEvent) => {
    event.stopPropagation();
    if (selectedTool === 'select') {
      setSelectedRoom(room);
      setSelectedWall(null);
      setSelectedDoor(null);
    }
  };

  const handleWallClick = (wall: Wall, event: React.MouseEvent) => {
    event.stopPropagation();
    if (selectedTool === 'select') {
      setSelectedWall(wall);
      setSelectedRoom(null);
      setSelectedDoor(null);
    }
  };

  const handleDoorClick = (door: Door, event: React.MouseEvent) => {
    event.stopPropagation();
    if (selectedTool === 'select') {
      setSelectedDoor(door);
      setSelectedRoom(null);
      setSelectedWall(null);
    }
  };

  const handleCanvasClick = () => {
    if (selectedTool === 'select') {
      setSelectedRoom(null);
      setSelectedWall(null);
      setSelectedDoor(null);
    }
  };

  const deleteSelectedObject = () => {
    if (selectedRoom) {
      setRooms(prev => prev.filter(r => r.id !== selectedRoom.id));
      setSelectedRoom(null);
    } else if (selectedWall) {
      setWalls(prev => prev.filter(w => w.id !== selectedWall.id));
      setSelectedWall(null);
    } else if (selectedDoor) {
      setDoors(prev => prev.filter(d => d.id !== selectedDoor.id));
      setSelectedDoor(null);
    }
  };

  const openEditDialog = () => {
    if (selectedRoom) {
      setEditRoomName(selectedRoom.name);
      setEditRoomColor(getRoomColor(selectedRoom.type));
      setIsEditDialogOpen(true);
    }
  };

  const saveRoomChanges = () => {
    if (selectedRoom) {
      setRooms(prev => prev.map(room => 
        room.id === selectedRoom.id 
          ? { ...room, name: editRoomName, type: 'custom' }
          : room
      ));
      setSelectedRoom(prev => prev ? { ...prev, name: editRoomName, type: 'custom' } : null);
    }
    setIsEditDialogOpen(false);
  };

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const getRoomColor = (type: string) => {
    const colors = {
      living: '#2563EB',
      kitchen: '#059669',
      bedroom: '#7C3AED',
      bathroom: '#DC2626',
      corridor: '#6B7280',
      room: '#8B5CF6',
      custom: editRoomColor
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  };

  const getRoomColorForEdit = (room: Room) => {
    if (room.type === 'custom') {
      return editRoomColor;
    }
    return getRoomColor(room.type);
  };

  const getLayerVisibility = (type: string) => {
    const layer = layers.find(l => l.type === type);
    return layer ? layer.visible : true;
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
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
              
              {(selectedRoom || selectedWall || selectedDoor) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-2">Выбрано:</p>
                  <p className="text-sm font-medium text-blue-900">
{selectedRoom?.name || (selectedWall ? 'Стена' : 'Дверь')}
                  </p>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="w-full mt-2"
                    onClick={deleteSelectedObject}
                  >
                    <Icon name="Trash2" size={14} className="mr-1" />
                    Удалить
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Слои</h3>
              <div className="space-y-3">
                {layers.map((layer) => (
                  <div key={layer.id} className="flex items-center justify-between">
                    <span className="text-sm">{layer.name}</span>
                    <Switch
                      checked={layer.visible}
                      onCheckedChange={() => toggleLayer(layer.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Вид</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 mb-2 block">Масштаб: {Math.round(zoom * 100)}%</label>
                  <Slider
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                    min={0.1}
                    max={5}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={resetView} className="w-full">
                  <Icon name="RotateCcw" size={14} className="mr-2" />
                  Сбросить вид
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Сетка</h3>
              <div className="text-xs text-gray-600">
                <div>Размер: 1м</div>
                <div>Координаты: {Math.round(mousePos.x)}, {Math.round(mousePos.y)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex">
          <div 
            ref={containerRef}
            className="flex-1 bg-white relative overflow-hidden cursor-crosshair"
            style={{ cursor: selectedTool === 'select' ? 'default' : 'crosshair' }}
          >
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              onContextMenu={(e) => e.preventDefault()}
              onClick={handleCanvasClick}
            >
              <defs>
                <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse">
                  <path d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`} fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                </pattern>
              </defs>
              
              {/* Grid */}
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Walls Layer */}
                {getLayerVisibility('walls') && (
                  <g>
                    {walls.map((wall) => (
                      <line
                        key={wall.id}
                        x1={wall.start.x}
                        y1={wall.start.y}
                        x2={wall.end.x}
                        y2={wall.end.y}
                        stroke={selectedWall?.id === wall.id ? "#2563EB" : "#1f2937"}
                        strokeWidth={selectedWall?.id === wall.id ? wall.thickness + 1 : wall.thickness}
                        className="cursor-pointer hover:stroke-blue-600"
                        onClick={(e) => handleWallClick(wall, e)}
                      />
                    ))}
                    
                    {/* Preview line while drawing */}
                    {isDrawing && selectedTool === 'wall' && drawingStart && (
                      <line
                        x1={drawingStart.x}
                        y1={drawingStart.y}
                        x2={snapToAngle(drawingStart, mousePos).x}
                        y2={snapToAngle(drawingStart, mousePos).y}
                        stroke="#2563EB"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    )}
                  </g>
                )}

                {/* Doors Layer */}
                {getLayerVisibility('doors') && (
                  <g>
                    {doors.map((door) => (
                      <g key={door.id} transform={`translate(${door.position.x}, ${door.position.y}) rotate(${door.angle})`}>
                        <path
                          d={`M 0 0 A ${door.width} ${door.width} 0 0 1 ${door.width} 0`}
                          stroke={selectedDoor?.id === door.id ? "#2563EB" : "#059669"}
                          strokeWidth={selectedDoor?.id === door.id ? "3" : "2"}
                          fill="none"
                          className="cursor-pointer hover:stroke-green-700"
                          onClick={(e) => handleDoorClick(door, e)}
                        />
                        <line 
                          x1="0" 
                          y1="0" 
                          x2={door.width} 
                          y2="0" 
                          stroke={selectedDoor?.id === door.id ? "#2563EB" : "#059669"} 
                          strokeWidth={selectedDoor?.id === door.id ? "3" : "2"}
                          onClick={(e) => handleDoorClick(door, e)}
                        />
                      </g>
                    ))}
                  </g>
                )}

                {/* Rooms Layer */}
                {getLayerVisibility('rooms') && (
                  <g>
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
                          strokeWidth={selectedRoom?.id === room.id ? "3" : "2"}
                          className="cursor-pointer hover:fill-opacity-20 transition-all"
                          onClick={(e) => handleRoomClick(room, e)}
                        />
                        <text
                          x={room.x + room.width / 2}
                          y={room.y + room.height / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-xs font-medium pointer-events-none select-none"
                          fill={getRoomColor(room.type)}
                        >
                          {room.name}
                        </text>
                      </g>
                    ))}
                    
                    {/* Preview rectangle while drawing */}
                    {isDrawing && selectedTool === 'room' && drawingStart && (
                      <rect
                        x={Math.min(drawingStart.x, mousePos.x)}
                        y={Math.min(drawingStart.y, mousePos.y)}
                        width={Math.abs(mousePos.x - drawingStart.x)}
                        height={Math.abs(mousePos.y - drawingStart.y)}
                        fill="#8B5CF6"
                        fillOpacity="0.1"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    )}
                  </g>
                )}
              </g>
            </svg>
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
                
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" onClick={openEditDialog}>
                    <Icon name="Settings" size={16} className="mr-2" />
                    Редактировать свойства
                  </Button>
                  <Button className="w-full" variant="destructive" size="sm" onClick={deleteSelectedObject}>
                    <Icon name="Trash2" size={16} className="mr-2" />
                    Удалить комнату
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <Icon name="MousePointer" size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-sm mb-4">Выберите комнату на плане для просмотра информации</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• Используйте колесо мыши для масштабирования</p>
                  <p>• Средняя кнопка мыши для перетаскивания</p>
                  <p>• Выберите инструмент и рисуйте на холсте</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Координаты: {Math.round(mousePos.x)}, {Math.round(mousePos.y)}</span>
            <span>Масштаб: {Math.round(zoom * 100)}%</span>
            <span>Инструмент: {tools.find(t => t.id === selectedTool)?.name}</span>
            <span>Выбрано: {selectedRoom ? selectedRoom.name : 'Нет'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Готово к работе</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Диалог редактирования комнаты */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактирование комнаты</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Название
              </Label>
              <Input
                id="name"
                value={editRoomName}
                onChange={(e) => setEditRoomName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Цвет
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="color"
                  id="color"
                  value={editRoomColor}
                  onChange={(e) => setEditRoomColor(e.target.value)}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">{editRoomColor}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Площадь
              </Label>
              <div className="col-span-3">
                <span className="text-sm text-gray-600">{selectedRoom?.area} м²</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={saveRoomChanges}>
              Сохранить изменения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Index;