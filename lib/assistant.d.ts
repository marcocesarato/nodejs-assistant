/// <reference types="node" />
import { JWTInput } from 'google-auth-library';
import { AudioConversation } from './audio-conversation';
import { AssistantLanguage, AssistantOptions, AssistantResponse } from './common';
import { AudioInConfig, AudioOutConfig } from './proto';
import { TextConversation } from './text-conversation';
export interface AssistantQueryOptions {
    conversationState?: Buffer;
    audioInConfig?: AudioInConfig;
    audioOutConfig?: AudioOutConfig;
}
/**
 * The base class to connect with the Assistant.
 * @author Giorgio Garasto <giorgio@garasto.it>
 * @license MIT
 * @class
 */
export declare class Assistant {
    locale: AssistantLanguage;
    deviceId: string;
    deviceModelId: string;
    private _endpoint;
    private _client;
    /**
     * Creates a new connection with the assistant.
     * @param credentials - The credentials to use to authenticate with the Assistant.
     * @param options - Some additional (optional) options.
     * @param options.deviceId - The device ID to use in the conversations with the Assistant.
     * @param options.deviceModelId - The device model ID to use in the conversations with the Assistant.
     * @param options.locale - The locale to use in the conversations with the Assistant.
     * @constructor
     */
    constructor(credentials: JWTInput, options?: AssistantOptions);
    /**
     * Starts a new text conversation with the Assistant.
     * @param audioOutConfig - The audio output configuration.
     * @returns The new text conversation.
     */
    startTextConversation(audioOutConfig?: AudioOutConfig): TextConversation;
    /**
     * Starts a new audio conversation with the Assistant.
     * @param audioInConfig - The audio input configuration.
     * @param audioOutConfig - The audio output configuration.
     * @returns The new audio conversation.
     */
    startAudioConversation(audioInConfig?: AudioInConfig, audioOutConfig?: AudioOutConfig): AudioConversation;
    /**
     * Sends a single text query to the Assistant and wait for its response.
     * @param textOrAudio - The text query or the audio buffer to send to the Assistant.
     * @param options - The additional query options.
     * @returns A promise that resolves to the Assistant response.
     */
    query(textOrAudio: string | Buffer, { conversationState, audioInConfig, audioOutConfig, }?: AssistantQueryOptions): Promise<AssistantResponse>;
    private _createClient;
}
