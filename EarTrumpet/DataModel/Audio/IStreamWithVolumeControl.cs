using System;
using System.ComponentModel;

namespace EarTrumpet.DataModel.Audio
{
    public interface IStreamWithVolumeControl : INotifyPropertyChanged
    {
        string Id { get; }
        bool IsMuted { get; set; }
        float Volume { get; set; }
        float PeakValue1 { get; }
        float PeakValue2 { get; }
    }

    // Automatic writes carry a stable WASAPI event context so asynchronous
    // callbacks cannot be mistaken for a user's RDP volume change.
    internal interface IAutomaticVolumeWrite
    {
        void SetVolumeAutomatically(float value);
        void SetMuteAutomatically(bool value);
        bool ConsumeAutomaticVolumeChange();
    }

    internal static class AutomaticVolumeWriteContext
    {
        public static readonly Guid Id = new Guid("9c62fd84-14af-4e7a-9b0d-8b8b1de2c5f0");
    }
}
