import MainAppLoader from "./main-app-loader";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <MainAppLoader />
    </div>
  );
}
