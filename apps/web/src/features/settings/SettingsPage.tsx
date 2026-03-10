"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, documentsApi } from "@/lib/api";
import { UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Upload, Save } from "lucide-react";

export function SettingsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [skillInput, setSkillInput] = useState("");

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: profileApi.get,
  });

  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsApi.upload(file, "resume"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });

  const saveMutation = useMutation({
    mutationFn: () => profileApi.update({ skills }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills(prev => [...prev, s]);
      setSkillInput("");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Upload your CV and configure your job preferences</p>
      </div>

      <Card>
        <CardHeader><CardTitle>CV / Resume</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={e => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}>
            <Upload className="h-4 w-4 mr-2" />
            {uploadMutation.isPending ? "Uploading..." : "Upload CV"}
          </Button>
          {profile?.cv_text && (
            <p className="text-xs text-muted-foreground">
              CV loaded ({profile.cv_text.length} characters)
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Skills Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-md px-3 py-1.5 text-sm"
              placeholder="Add a skill (e.g. Python, React)"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSkill()}
            />
            <Button size="sm" variant="outline" onClick={addSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={s} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                {s}
                <button onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="hover:text-destructive">×</button>
              </span>
            ))}
          </div>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Skills"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
