// components/YourProcessingComponent.tsx
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

interface YourProcessingComponentProps {
  files: File[];
  partName: string;
  progress: number;
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  processKey: number;
  onComplete: () => void;
}

const YourProcessingComponent: React.FC<YourProcessingComponentProps> = ({
  files,
  partName,
  progress,
  setProgress,
  processKey,
  onComplete,
}) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (files.length === 0) return;

    let cancelled = false;

    const processFiles = async () => {
      setLogs([]);
      setProgress(0);

      for (let i = 0; i < files.length; i++) {
        if (cancelled) return;

        const file = files[i];
        const content = await file.text();

        console.log(`Processing: ${file.name}`);
        console.log(content.substring(0, 100));

        // setLogs((prev) => [
        //   ...prev,
        //   `Processed: ${file.name} (${content.length} characters)`,
        // ]);


        const percent = Math.round(((i + 1) / files.length) * 100);
        setProgress(percent);
      }

      if (!cancelled) {
        onComplete();
      }
    };

    processFiles();

    return () => {
      cancelled = true;
    };
  }, [processKey]);

  if (files.length === 0) return null;

  return (
    <Card sx={{ maxWidth: 800, mx: "auto", mt: 4, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Processing Part: {partName}
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Total Files: {files.length}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Progress: {progress}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {/* <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
          {logs.map((log, index) => (
            <ListItem key={index} divider>
              <ListItemText primary={log} />
            </ListItem>
          ))}
        </List> */}
      </CardContent>
    </Card>
  );
};

export default YourProcessingComponent;
