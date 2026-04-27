import React, { useState } from "react";
import Box from "@mui/material/Box";
import {
  Button,
  Typography,
  LinearProgress,
  Card,
  CardContent,
} from "@mui/material";

interface FileSystemUploadProps {
  onProcessPart: (files: File[], partName: string) => Promise<void>;
}

interface PartItem {
  name: string;
  handle: FileSystemDirectoryHandle;
}

const FileSystemUpload: React.FC<FileSystemUploadProps> = ({
  onProcessPart,
}) => {
  const [status, setStatus] = useState<string>("Idle");
  const [currentPart, setCurrentPart] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [parts, setParts] = useState<PartItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const readAllEntries = async (
    dirHandle: FileSystemDirectoryHandle
  ): Promise<[string, any][]> => {
    const iterator = (dirHandle as any).entries();

    const walk = async (acc: any[]): Promise<any[]> => {
      const { value, done } = await iterator.next();
      if (done) return acc;
      return walk([...acc, value]);
    };

    return walk([]);
  };

  const processFolder = async (
    folderName: string,
    dirHandle: FileSystemDirectoryHandle
  ): Promise<void> => {
    setCurrentPart(folderName);

    const entries = await readAllEntries(dirHandle);

    const files: File[] = (
      await Promise.all(
        entries.map(async ([, entry]) => {
          if (entry.kind === "file") {
            return entry.getFile();
          }
          return null;
        })
      )
    ).filter(Boolean) as File[];

    console.log(`===== ${folderName} =====`);
    console.log("Total files:", files.length);

    await onProcessPart(files, folderName);
  };

  const handlePickFolder = async (): Promise<void> => {
    try {
      setStatus("Picking folder...");
      setProgress(0);
      setCurrentPart("");

      const rootDir =
        (await (window as any).showDirectoryPicker()) as FileSystemDirectoryHandle;

      setSelectedFolder(rootDir.name);
      setStatus("Scanning parts...");

      const entries = await readAllEntries(rootDir);

      const discoveredParts = entries
        .filter(([, handle]) => handle.kind === "directory")
        .map(([name, handle]) => ({
          name,
          handle: handle as FileSystemDirectoryHandle,
        }))
        .sort((a, b) => {
          const numA = parseInt(a.name.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.name.replace(/\D/g, "")) || 0;
          return numA - numB;
        });

      setParts(discoveredParts);
      setStatus(`Ready to process ${discoveredParts.length} part(s)`);
    } catch (err) {
      console.error(err);
      setStatus("Cancelled / Error");
    }
  };

  const handleStartProcessing = async (): Promise<void> => {
    if (parts.length === 0 || isProcessing) return;

    try {
      setIsProcessing(true);
      setStatus("Processing...");
      setProgress(0);

      await parts.reduce(async (previousPromise, part, index) => {
        await previousPromise;

        await processFolder(part.name, part.handle);

        const percent = Math.round(((index + 1) / parts.length) * 100);
        setProgress(percent);

        await new Promise(requestAnimationFrame);
      }, Promise.resolve());

      setStatus("Done");
      setCurrentPart("");
    } catch (err) {
      console.error(err);
      setStatus("Processing Error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "#121212",
      }}
    >
      <Card sx={{ width: 550, borderRadius: 4, boxShadow: 6 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            📂 File System Upload (By Part)
          </Typography>

          <Button
            variant="contained"
            fullWidth
            onClick={handlePickFolder}
            disabled={isProcessing}
            sx={{ mb: 2 }}
          >
            Chọn Folder
          </Button>

          <Button
            variant="outlined"
            fullWidth
            onClick={handleStartProcessing}
            disabled={parts.length === 0 || isProcessing}
            sx={{ mb: 3 }}
          >
            Bắt đầu xử lý
          </Button>

          <Box sx={{ mb: 2 }}>
            <Typography>
              <b>Folder:</b> {selectedFolder || "-"}
            </Typography>
            <Typography>
              <b>Total Parts:</b> {parts.length}
            </Typography>
            <Typography>
              <b>Status:</b> {status}
            </Typography>
            <Typography>
              <b>Current Part:</b> {currentPart || "-"}
            </Typography>
            <Typography>
              <b>Progress:</b> {progress}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default FileSystemUpload;