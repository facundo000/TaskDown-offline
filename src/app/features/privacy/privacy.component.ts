import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-privacy',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './privacy.component.html',
    styleUrls: ['./privacy.component.css']
})
export class PrivacyComponent {
    lastUpdated = '27 de Noviembre de 2024';
}
