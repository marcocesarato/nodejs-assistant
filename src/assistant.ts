import { JWTInput, UserRefreshClient } from 'google-auth-library';
import * as grpc from 'grpc';
import { AudioConversation } from './audio-conversation';
import { AssistantLanguage, AssistantOptions, AssistantResponse, mapAssistResponseToAssistantResponse } from './common';
import {
  AssistResponse,
  AudioInConfig,
  AudioInEncoding,
  AudioOutConfig,
  AudioOutEncoding,
  EmbeddedAssistant as EmbeddedAssistantInstance,
  embeddedAssistantPb as EmbeddedAssistant,
} from './proto';
import { TextConversation } from './text-conversation';

export interface AssistantQueryOptions {
  conversationState?: Buffer;
  audioOutConfig?: AudioOutConfig;
}

/**
 * The base class to connect with the Assistant.
 * @author Giorgio Garasto <giorgio@garasto.it>
 * @license MIT
 * @class
 */
export class Assistant {
  public locale: AssistantLanguage;
  public deviceId: string;
  public deviceModelId: string;
  private _endpoint = 'embeddedassistant.googleapis.com';
  private _client: EmbeddedAssistantInstance;

  /**
   * Creates a new connection with the assistant.
   * @param credentials - The credentials to use to authenticate with the Assistant.
   * @param options - Some additional (optional) options.
   * @param options.deviceId - The device ID to use in the conversations with the Assistant.
   * @param options.deviceModelId - The device model ID to use in the conversations with the Assistant.
   * @param options.locale - The locale to use in the conversations with the Assistant.
   * @constructor
   */
  constructor(credentials: JWTInput, options: AssistantOptions = {
    deviceId: 'default',
    deviceModelId: 'default',
    locale: AssistantLanguage.ENGLISH,
  }) {
    this.locale = options.locale;
    this.deviceId = options.deviceId;
    this.deviceModelId = options.deviceModelId;
    this._client = this._createClient(credentials);
  }

  /**
   * Starts a new text conversation with the Assistant.
   * @param audioOutConfig - The audio output configuration.
   * @returns The new text conversation.
   */
  public startTextConversation(audioOutConfig: AudioOutConfig = {
    encoding: AudioOutEncoding.LINEAR16,
    sampleRateHertz: 16000,
    volumePercentage: 100,
  }): TextConversation {
    return new TextConversation(
      this._client.assist(),
      this.deviceId,
      this.deviceModelId,
      this.locale,
      audioOutConfig,
    );
  }

  /**
   * Starts a new audio conversation with the Assistant.
   * @param audioInConfig - The audio input configuration.
   * @param audioOutConfig - The audio output configuration.
   * @returns The new audio conversation.
   */
  public startAudioConversation(
    audioInConfig: AudioInConfig = {
      encoding: AudioInEncoding.LINEAR16,
      sampleRateHertz: 16000,
    },
    audioOutConfig: AudioOutConfig = {
      encoding: AudioOutEncoding.LINEAR16,
      sampleRateHertz: 16000,
      volumePercentage: 100,
    },
  ): AudioConversation {
    return new AudioConversation(
      this._client.assist(),
      this.deviceId,
      this.deviceModelId,
      this.locale,
      audioInConfig,
      audioOutConfig,
    );
  }

  /**
   * Sends a single text query to the Assistant and wait for its response.
   * @param text - The text query to send to the Assistant.
   * @param audioOutConfig - The audio output configuration.
   * @returns A promise that resolves to the Assistant response.
   */
  public query(text: string, {
    conversationState,
    audioOutConfig = {
      encoding: AudioOutEncoding.LINEAR16,
      sampleRateHertz: 16000,
      volumePercentage: 100,
    },
  }: AssistantQueryOptions): Promise<AssistantResponse> {
    const conversation = this._client.assist();
    return new Promise((resolve, reject) => {
      const response: AssistantResponse = {};
      conversation.on('data', (data: AssistResponse) => {
        const mappedData = mapAssistResponseToAssistantResponse(data);
        if (mappedData.action) {
          response.action = {
            ...response.action,
            ...mappedData.action,
          };
        }
        if (mappedData.actionOnGoogle) {
          response.actionOnGoogle = {
            ...response.actionOnGoogle,
            ...mappedData.actionOnGoogle,
          };
        }
        if (mappedData.audio) {
          response.audio = response.audio ?
            Buffer.concat([response.audio, mappedData.audio]) :
            mappedData.audio;
        }
        if (mappedData.conversationEnded) {
          response.conversationEnded = mappedData.conversationEnded;
        }
        if (mappedData.conversationState) {
          response.conversationState = mappedData.conversationState;
        }
        if (mappedData.html) {
          response.html = response.html ? `${response.html} ${mappedData.html}` : mappedData.html;
        }
        if (mappedData.newVolume) {
          response.newVolume = mappedData.newVolume;
        }
        if (mappedData.speechRecognitionResults) {
          response.speechRecognitionResults =
            [...(response.speechRecognitionResults || []), ...mappedData.speechRecognitionResults];
        }
        if (mappedData.text) {
          response.text = response.text ? `${response.text} ${mappedData.text}` : mappedData.text;
        }
      });
      conversation.on('end', () => {
          // Response ended, resolve with the whole response.
          resolve(response);
      });
      conversation.on('error', reject);
      conversation.write({
        config: {
          audioOutConfig,
          deviceConfig: {
            deviceId: this.deviceId,
            deviceModelId: this.deviceModelId,
          },
          dialogStateIn: {
            conversationState,
            languageCode: this.locale,
          },
          textQuery: text,
        },
      });
      conversation.end();
    });
  }

  private _createClient(credentials: JWTInput): EmbeddedAssistantInstance {
    const sslCreds = grpc.credentials.createSsl();
    const refresh = new UserRefreshClient();
    refresh.fromJSON(credentials);
    const callCreds = grpc.credentials.createFromGoogleCredential(refresh);
    const combinedCreds = grpc.credentials.combineChannelCredentials(sslCreds, callCreds);
    const client = new EmbeddedAssistant(this._endpoint, combinedCreds);
    return client;
  }
}