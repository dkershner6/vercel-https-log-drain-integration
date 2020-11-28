const { withUiHook, htm } = require("@vercel/integration-utils");

const LOG_DRAINS_PATH = `/v1/integrations/log-drains`;

module.exports = withUiHook(async ({ payload, vercelClient }) => {
    const { clientState, action } = payload;
    const store = await vercelClient.getMetadata();
    let successMessage = null;
    let errorMessage = null;

    const getOldLogDrains = async () => {
        const response = await vercelClient.fetch(LOG_DRAINS_PATH);
        return await response.json();
    };

    const deleteAllOldLogDrains = async () => {
        const oldLogDrains = await getOldLogDrains();
        for (const logDrain of oldLogDrains) {
            await vercelClient.fetch(`${LOG_DRAINS_PATH}/${logDrain.id}`);
        }
    };

    if (action === "submit") {
        await deleteAllOldLogDrains();
        store.drainUrl = clientState.drainUrl;

        if (store && store.drainUrl && store.drainUrl.length > 0) {
            const body = JSON.stringify({
                name: "HTTPS Log Drain",
                type: "json",
                url: store.drainUrl,
            });
            try {
                const response = await vercelClient.fetch(LOG_DRAINS_PATH, {
                    method: "POST",
                    body,
                });
                await response.json();
                successMessage = "Log Drain set up successfully";
            } catch (error) {
                errorMessage = `Error: ${error.message}`;
            }
        }
        await vercelClient.setMetadata(store);
    }

    const drainUrl = store && store.drainUrl ? store.drainUrl : "";

    return htm`
    <Page>
        ${
            successMessage
                ? htm`<Notice type="success">${successMessage}</Notice>`
                : ""
        }
            ${
                errorMessage
                    ? htm`<Notice type="error">${errorMessage}</Notice>`
                    : ""
            }
            <P>This integration is open source and <Link href="https://github.com/dkershner6/vercel-https-log-drain-integration">can be found on GitHub</Link></P>
        <Box display="flex" justifyContent="space-between">
            
            <Box flex="1">
                <Input label="Log Drain URL" name="drainUrl" width="100%" value="${drainUrl}" />          
            </Box>
            <Box margin="20px" alignSelf="center">
                <Button action="submit">Submit</Button>
            </Box>
        </Box>
    </Page>
  `;
});
