import Header from "@/components/Header"
export default function LayoutContent({ children }) {
    return (
      <div className="bg-white rounded-layout flex-1 m-2 flex flex-col">
        <Header />
        <div className="border-t border-separator pt-4 flex-1">
          {children}
        </div>
      </div>
    );
  }