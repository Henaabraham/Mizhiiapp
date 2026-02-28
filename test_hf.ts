async function run() {
    const url = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-11B-Vision-Instruct";
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                inputs: {
                    image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
                    text: "What is this?"
                }
            })
        });
        console.log(res.status, await res.text());
    } catch (e) {
        console.error(e);
    }
}
run();
