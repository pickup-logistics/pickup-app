const { exec } = require('child_process');
console.log('Starting generation...');
exec('npx prisma generate', { cwd: 'c:\\Users\\emmya\\Desktop\\PickUp\\backend' }, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
});
