/*
 * *
 *  @license
 *  Copyright Hôpitaux Universitaires de Genève All Rights Reserved.
 *
 *  Use of this source code is governed by an Apache-2.0 license that can be
 *  found in the LICENSE file at https://github.com/DSI-HUG/dejajs-components/blob/master/LICENSE
 * /
 *
 */

import { Directive, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { DejaTooltipService } from '.';

@Directive({
    selector: '[deja-tooltip]',
})
export class DejaTooltipDirective {
    @Input('tooltip-model') public model: any;
    @Input('deja-tooltip') public name: string;
    // tslint:disable-next-line:no-output-rename
    @Output('tooltip-show') public show = new EventEmitter();

    constructor(elementRef: ElementRef, tooltipService: DejaTooltipService) {
        const element = elementRef.nativeElement as HTMLElement;

        const leave$ = Observable.fromEvent(element, 'mouseleave');

        Observable.fromEvent(element, 'mouseenter')
            .flatMap((e) => Observable.of(e).delay(200).takeUntil(leave$))
            .subscribe(() => {
                tooltipService.params[this.name] = {
                model: this.model,
                    ownerElement: elementRef,
            };

            this.show.emit();
            });
    }
}