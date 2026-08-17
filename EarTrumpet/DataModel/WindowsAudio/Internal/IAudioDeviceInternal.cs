using EarTrumpet.DataModel.Audio;

namespace EarTrumpet.DataModel.WindowsAudio.Internal
{
    interface IAudioDeviceInternal
    {
        void UpdatePeakValue();
        void MoveHiddenAppsToDevice(string appId, string id);
        void UnhideSessionsForProcessId(int processId);
        void HideSessionsForDefaultMove(IAudioDeviceSession targetSession);
    }
}
