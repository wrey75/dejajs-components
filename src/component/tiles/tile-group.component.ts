/*
 *  @license
 *  Copyright Hôpitaux Universitaires de Genève. All Rights Reserved.
 *
 *  Use of this source code is governed by an Apache-2.0 license that can be
 *  found in the LICENSE file at https://github.com/DSI-HUG/dejajs-components/blob/master/LICENSE
 */

import { Component, EventEmitter, HostBinding, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { Color } from '../../common/core/graphics/color';
import { DejaEditableDirective } from '../content-editable/content-editable.directive';
import { IDejaTile } from './tile.interface';

@Component({
    selector: 'deja-tile-group',
    styleUrls: [
        './tile-group.component.scss',
    ],
    templateUrl: './tile-group.component.html',
})
export class DejaTileGroupComponent implements OnDestroy {
    public static defaultColor = 'rgb(38, 50, 56)';
    @Input() public model: IDejaTile;
    @Output() public close = new EventEmitter<void>();
    @Output() public titleChanged = new EventEmitter<string>();

    @HostBinding('style.background-color') protected backgroundColor = DejaTileGroupComponent.defaultColor;
    @HostBinding('style.color') protected foregroundColor = null;

    private edit$ = new Subject<void>();
    private edit$sub: Subscription;
    @ViewChild(DejaEditableDirective) private title: DejaEditableDirective;
    @HostBinding('attr.designMode') private _designMode = false;

    constructor() {
        this.edit$sub = Observable.from(this.edit$)
            .filter(() => this._designMode)
            .debounceTime(100)
            .subscribe(() => this.title.edit(true));
    }

    @Input()
    public set color(color: string) {
        this.backgroundColor = color || DejaTileGroupComponent.defaultColor;
        this.foregroundColor = Color.parse(this.backgroundColor).bestTextColor.toHex();
    }

    @Input()
    public set designMode(value: boolean | string) {
        this._designMode = value != null && `${value}` !== 'false';
    }

    public get designMode() {
        return this._designMode;
    }

    public ngOnDestroy() {
        this.edit$sub.unsubscribe();
    }
}
