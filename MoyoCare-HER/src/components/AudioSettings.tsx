import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VoiceSettings {
  voiceIndex: number;
  rate: number;
  pitch: number;
  volume: number;
}

interface AudioSettingsProps {
  onSettingsChange: (settings: VoiceSettings) => void;
  availableVoices: SpeechSynthesisVoice[];
  currentLanguage: string;
}

export default function AudioSettings({ onSettingsChange, availableVoices, currentLanguage }: AudioSettingsProps) {
  const [settings, setSettings] = useState<VoiceSettings>({
    voiceIndex: 0,
    rate: currentLanguage === 'yo' || currentLanguage === 'ig' || currentLanguage === 'ha' ? 0.8 : 1,
    pitch: 1,
    volume: 1,
  });

  const [voicesForLang, setVoicesForLang] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Filter voices for current language
    const filtered = availableVoices.filter(voice => {
      const voiceLang = voice.lang.split('-')[0];
      const currentLang = currentLanguage === 'en' ? 'en' :
        currentLanguage === 'yo' ? 'yo' :
        currentLanguage === 'ig' ? 'ig' :
        currentLanguage === 'ha' ? 'ha' : 'en';
      return voiceLang === currentLang;
    });
    setVoicesForLang(filtered);
    setSettings(prev => ({ ...prev, voiceIndex: 0 }));
  }, [currentLanguage, availableVoices]);

  const handleSettingChange = (key: keyof VoiceSettings, value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Card className="bg-white border-pink-200">
      <CardHeader>
        <CardTitle className="text-pink-600">Voice Settings</CardTitle>
        <CardDescription>Customize audio playback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Selection */}
        <div className="space-y-2">
          <Label htmlFor="voice-select">Voice</Label>
          <Select 
            value={settings.voiceIndex.toString()}
            onValueChange={(val) => handleSettingChange('voiceIndex', parseInt(val))}
          >
            <SelectTrigger id="voice-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {voicesForLang.map((voice, idx) => (
                <SelectItem key={idx} value={idx.toString()}>
                  {voice.name} {voice.default ? '(Default)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Speech Rate */}
        <div className="space-y-2">
          <Label htmlFor="rate-slider">Speech Rate: {settings.rate.toFixed(1)}x</Label>
          <Slider
            id="rate-slider"
            min={0.5}
            max={2}
            step={0.1}
            value={[settings.rate]}
            onValueChange={(val) => handleSettingChange('rate', val[0])}
            className="w-full"
          />
        </div>

        {/* Pitch */}
        <div className="space-y-2">
          <Label htmlFor="pitch-slider">Pitch: {settings.pitch.toFixed(1)}</Label>
          <Slider
            id="pitch-slider"
            min={0.5}
            max={2}
            step={0.1}
            value={[settings.pitch]}
            onValueChange={(val) => handleSettingChange('pitch', val[0])}
            className="w-full"
          />
        </div>

        {/* Volume */}
        <div className="space-y-2">
          <Label htmlFor="volume-slider">Volume: {Math.round(settings.volume * 100)}%</Label>
          <Slider
            id="volume-slider"
            min={0}
            max={1}
            step={0.05}
            value={[settings.volume]}
            onValueChange={(val) => handleSettingChange('volume', val[0])}
            className="w-full"
          />
        </div>

        <div className="pt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <p><strong>Tip:</strong> For African languages (Yoruba, Igbo, Hausa), slower speech rate helps with pronunciation clarity.</p>
        </div>
      </CardContent>
    </Card>
  );
}
