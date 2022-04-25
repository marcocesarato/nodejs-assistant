import { Conversation } from './conversation';

/**
 * Represents an audio conversation with the Assistant.
 * @author Giorgio Garasto <giorgio@garasto.it>
 * @license MIT
 * @class
 */
class AudioConversation extends Conversation {
    /**
     * Creates a new audio conversation.
     * @param _stream - The duplex stream to use to communicate with the Assistant SDK.
     * @param _deviceId - The device ID to use during this conversation.
     * @param _deviceModelId - The device model ID to use during this conversation.
     * @param locale - The locale to use during this conversation.
     * @param audioInConfig - The audio input configuration.
     * @param audioOutConfig - The audio output configuration.
     * @constructor
     */
    constructor(_stream, _deviceId, _deviceModelId, locale, audioInConfig, audioOutConfig) {
        super(_stream, _deviceId, _deviceModelId, locale);
        this.sendRequest({
            audioInConfig,
            audioOutConfig,
            deviceId: _deviceId,
            deviceModelId: _deviceModelId,
            isNewConversation: true,
            locale,
        });
    }
    /**
     * Sends audio to the Assistant.
     * @param audio - The audio buffer to send to the Assistant.
     * @returns A boolean that tells whether the audio buffer was successfully sent or not.
     */
    send(audio) {
        return this.sendRequest({ audio });
    }
}

export { AudioConversation };