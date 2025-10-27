import { ImgHTMLAttributes } from 'react';
import Logo  from '../../../public/1.png';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img 
            {...props} 
            src={Logo} 
            alt="logo"
        />
    );
}
