// App.tsx
import React, { useEffect, useRef, useState } from "react";
import FileSystemUpload from "./components/FileSystemUpload";
import YourProcessingComponent from "./components/yourProcessingComponent";

const App: React.FC = () => {
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [currentPartName, setCurrentPartName] = useState("");
  const [progress, setProgress] = useState(0);
  const [processKey, setProcessKey] = useState(0);

  const completeResolver = useRef<(() => void) | null>(null);

  const waitForProcessingComplete = () =>
    new Promise<void>((resolve) => {
      completeResolver.current = resolve;
    });

  const handleProcessingComplete = () => {
    completeResolver.current?.();
    completeResolver.current = null;
  };

  const handleProcessPart = async (files: File[], partName: string) => {
    console.log(`===== Processing ${partName} =====`);

    setCurrentPartName(partName);
    setCurrentFiles(files);
    setProgress(0);
    setProcessKey((prev) => prev + 1);

    // Chờ YourProcessingComponent xử lý xong toàn bộ file trong part
    await waitForProcessingComplete();

    console.log(`✅ Finished ${partName}`);
  };

  return (
    <>
      <FileSystemUpload onProcessPart={handleProcessPart} />

      <YourProcessingComponent
        files={currentFiles}
        partName={currentPartName}
        progress={progress}
        setProgress={setProgress}
        processKey={processKey}
        onComplete={handleProcessingComplete}
      />
    </>
  );
};

export default App;