type PageLoadingProps = {
  message?: string;
};

export default function PageLoading({
  message = 'Carregando...',
}: PageLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="relative mx-auto mb-5 h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-cafe-100" />
          <div className="absolute inset-0 rounded-full border-4 border-cafe-700 border-t-transparent animate-spin" />
          <div className="absolute inset-3 rounded-full bg-cafe-700/10" />
        </div>
        <p className="text-cafe-800 text-sm font-semibold">{message}</p>
      </div>
    </div>
  );
}
