import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";

export default function DropdownTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger className="px-4 py-2 bg-blue-600 text-white rounded shadow">
          Abrir menú
        </DropdownMenuTrigger>
        <DropdownMenuContent
          sideOffset={8}
          collisionPadding={{ left: 16, right: 32 }}
          className="z-50 min-w-[8rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border bg-white p-2 shadow-lg"
        >
          <DropdownMenuItem className="px-2 py-1 hover:bg-gray-100 rounded">
            Opción 1
          </DropdownMenuItem>
          <DropdownMenuItem className="px-2 py-1 hover:bg-gray-100 rounded">
            Opción 2
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}