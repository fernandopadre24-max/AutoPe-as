import React, { type JSX } from 'react';
import type { QrcodeProps } from 'react-qrcode-pretty';
import Component from './qrcode-component.class';
import type { PIXProps } from './pix.types';
import PixPayload from './pix.class';

export * from 'react-qrcode-pretty';

/**
 * REACT-QRCODE-PIX
 *
 * @author Guilherme Neves <guilhermeasn@yahoo.com.br>
 */

/**
 * Gera o payload para poder usar no qrcode ou no sistema copia e cola do PIX
 */
export function payload(props: PIXProps) {
    const pix = new PixPayload(props);
    return pix.payload();
}

export type PixCanvasComponentProps = PIXProps &
  Omit<QrcodeProps<'canvas'>, 'value'> & {
    onLoad?: (payload: string) => void;
    children?: React.ReactNode;
  };

export type PixSVGComponentProps = PIXProps &
  Omit<QrcodeProps<'SVG'>, 'value'> & {
    onLoad?: (payload: string) => void;
    children?: React.ReactNode;
  };

/**
 * Qrcode estatico do PIX
 */
export function PixCanvas({
    pixkey,
    merchant,
    city,
    cep,
    code,
    amount,
    ignoreErrors = false,
    onLoad = (_: string) => {},
    ...settings
}: PixCanvasComponentProps): React.ReactElement {
    if (typeof settings.size === 'undefined') {
      settings.size = 256;
    }

    try {
        return React.createElement(Component<'canvas'>, {
            payload: payload({ pixkey, merchant, city, cep, code, amount, ignoreErrors }),
            qrcodeType: 'canvas',
            settings,
            onLoad
        });
    } catch (error) {

        return React.createElement('div', {
            style: {
                width: settings?.size,
                height: settings?.size,
                margin: '10px 0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#e5d5d5',
                border: 'solid 1px',
                borderRadius: '10px',
                borderColor: '#440000',
                textAlign: 'center',
                color: '#770000',
                fontSize: '18px',
                opacity: '0.75'
            }
        }, 'PIX não pode ser carregado!');
    }
}

/**
 * Qrcode estatico do PIX em SVG
 */
export function PixSVG({
    pixkey,
    merchant,
    city,
    cep,
    code,
    amount,
    ignoreErrors = false,
    onLoad = (_: string) => {},
    ...settings
}: PixSVGComponentProps): React.ReactElement {
    if (typeof settings.size === 'undefined') {
      settings.size = 256;
    }

    try {
        return React.createElement(Component<'SVG'>, {
            payload: payload({ pixkey, merchant, city, cep, code, amount, ignoreErrors }),
            qrcodeType: 'SVG',
            settings,
            onLoad
        });
    } catch (error) {

        return React.createElement('div', {
            style: {
                width: settings?.size,
                height: settings?.size,
                margin: '10px 0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#e5d5d5',
                border: 'solid 1px',
                borderRadius: '10px',
                borderColor: '#440000',
                textAlign: 'center',
                color: '#770000',
                fontSize: '18px',
                opacity: '0.75'
            }
        }, 'PIX não pode ser carregado!');
    }
}

export default PixCanvas;