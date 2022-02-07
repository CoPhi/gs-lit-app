import { Error, IMonarchLanguage, Language, Position, Suggestion } from "cophi-lang";
import fetch from 'cross-fetch';
import pako from 'pako';

const host = 'http://localhost:8080'

export class GsLiteraryApp implements Language {
    id = new Promise<string>((resolve) => resolve('gs-lit-app'));
    version = new Promise<string>((resolve) => resolve('0.0.1'));
    name = new Promise<string>((resolve) => resolve('Literary apparatus'));
    capabilities = new Promise<string[]>((resolve) => resolve(['highlight', 'autocomplete']));

    errors(code: string): Promise<Error[]> {

        const ss = pako.deflate(code).toString()

        return fetch(`${host}/errors?code=${ss}`)
            .then(response => response.json() as unknown as Error[])
            .catch(() => []);
    }

    suggestions(code: string, pos: Position): Promise<Suggestion[]> {
        return new Promise<Suggestion[]>((resolve) => resolve([])); // TODO
    }

    // TODO: create a proper highlighter
    highlighter = new Promise<IMonarchLanguage>((resolve) => resolve(
        {
            keywords: [

            ],
            typeKeywords: [
            ],
            operators: [

            ],
            symbols: /[=><!~?:&|+\-*\/\^%]+/,
            escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
            tokenizer: {
                root: [
                    // identifiers and keywords
                    [/[a-z_$][\w$]*/, {
                        cases: {
                            '@typeKeywords': 'keyword',
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                        }
                    }],
                    [/[A-Z][\w\$]*/, 'type.identifier'],  // to show class names nicely

                    // whitespace
                    { include: '@whitespace' },

                    // delimiters and operators
                    [/[{}()\[\]]/, '@brackets'],
                    [/[<>](?!@symbols)/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],

                    // @ annotations.
                    // As an example, we emit a debugging log message on these tokens.
                    // Note: message are supressed during the first load -- change some lines to see them.
                    [/@\s*[a-zA-Z_\$][\w\$]*/, { token: 'annotation', log: 'annotation token: $0' }],

                    // numbers
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                    [/\d+/, 'number'],

                    // delimiter: after number because of .\d floats
                    [/[;,.]/, 'delimiter'],

                    // strings
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
                    [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

                    // characters
                    [/'[^\\']'/, 'string'],
                    [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                    [/'/, 'string.invalid']
                ],

                comment: [
                    [/[^\/*]+/, 'comment'],
                    [/\/\*/, 'comment', '@push'],    // nested comment
                    ['\\*/', 'comment', '@pop'],
                    [/[\/*]/, 'comment']
                ],

                string: [
                    [/[^\\"]+/, 'string'],
                    [/@escapes/, 'string.escape'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                ],

                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/\/\*/, 'comment', '@comment'],
                    [/\/\/.*$/, 'comment'],
                ],
            },
        }
    )); // TODO
}